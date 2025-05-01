import {
  Transport,
  TransportSendOptions,
} from '@modelcontextprotocol/sdk/shared/transport.js'
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'
import {
  ContainerPerRequestConnection,
  PersistentContainerConnection,
} from '../../common/types.js'
import Docker from 'dockerode'

const createContainerPerRequestTransport = (
  connection: Readonly<ContainerPerRequestConnection>
): Readonly<Transport> => {
  const docker = new Docker()

  return {
    start: async () => Promise.resolve(),
    send: async (
      message: Readonly<JSONRPCMessage>,
      options?: Readonly<TransportSendOptions>
    ) => {
      const containerOptions = {
        Tty: connection.options?.containerPerRequest?.tty ?? false,
        AttachStdin:
          connection.options?.containerPerRequest?.attachStdin ?? false,
        AttachStdout:
          connection.options?.containerPerRequest?.attachStdout ?? true,
        AttachStderr:
          connection.options?.containerPerRequest?.attachStderr ?? true,
        Env: Object.entries(connection.env || {}).map(([k, v]) => `${k}=${v}`),
        Network: connection.options?.network,
        HostConfig: {
          AutoRemove: connection.options?.autoRemove ?? true,
          Binds: connection.options?.volumes?.map(
            v => `${v.hostPath}:${v.containerPath}${v.mode ? ':' + v.mode : ''}`
          ),
        },
      }

      const outputStream = new (require('stream').Writable)()
      let output = ''
      outputStream._write = (
        chunk: Buffer,
        _: string,
        callback: () => void
      ) => {
        output += chunk.toString()
        callback()
      }

      try {
        const container = await docker.run(
          connection.image,
          [...(connection.command || []), JSON.stringify(message)],
          outputStream,
          containerOptions
        )

        try {
          const result = JSON.parse(output.trim())
          return result
        } catch (parseError) {
          throw new Error(`Failed to parse docker tool output: ${output}`)
        }
      } catch (err) {
        throw err
      }
    },
    close: async () => Promise.resolve(),
    onmessage: () => {},
    onerror: () => {},
  }
}

const createPersistentContainerTransport = (
  connection: Readonly<PersistentContainerConnection>
): Readonly<Transport> => {
  const docker = new Docker()
  let container: Docker.Container | null = null

  return {
    start: async () => {
      const containerOptions = {
        Image: connection.image,
        Cmd: connection.command ? [...connection.command] : undefined,
        Env: Object.entries(connection.env || {}).map(([k, v]) => `${k}=${v}`),
        Network: connection.options?.network,
        HostConfig: {
          AutoRemove: connection.options?.autoRemove ?? false,
          RestartPolicy: {
            Name:
              connection.options?.persistentContainer?.restartPolicy ?? 'no',
          },
          Binds: connection.options?.volumes?.map(
            v => `${v.hostPath}:${v.containerPath}${v.mode ? ':' + v.mode : ''}`
          ),
        },
        Healthcheck: connection.options?.persistentContainer?.healthCheck
          ? {
              Test: connection.options.persistentContainer.healthCheck.test,
              Interval:
                connection.options.persistentContainer.healthCheck.interval,
              Timeout:
                connection.options.persistentContainer.healthCheck.timeout,
              Retries:
                connection.options.persistentContainer.healthCheck.retries,
              StartPeriod:
                connection.options.persistentContainer.healthCheck.startPeriod,
            }
          : undefined,
      }

      const newContainer = await docker.createContainer(containerOptions)
      if (!newContainer) {
        throw new Error('Failed to create container')
      }
      container = newContainer
      await container.start()
    },
    send: async (
      message: Readonly<JSONRPCMessage>,
      options?: Readonly<TransportSendOptions>
    ) => {
      if (!container) {
        throw new Error('Docker container not started')
      }

      const exec = await container.exec({
        Cmd: [...(connection.command || []), JSON.stringify(message)],
        AttachStdout: true,
        AttachStderr: true,
        Env: Object.entries(connection.env || {}).map(([k, v]) => `${k}=${v}`),
      })

      return new Promise((resolve, reject) => {
        exec.start({}, (err, stream) => {
          if (err) {
            reject(err)
            return
          }

          if (!stream) {
            reject(new Error('Failed to start exec stream'))
            return
          }

          let output = ''
          stream.on('data', chunk => {
            output += chunk.toString()
          })

          stream.on('end', () => {
            try {
              const result = JSON.parse(output)
              resolve(result)
            } catch (parseError) {
              reject(new Error(`Failed to parse docker tool output: ${output}`))
            }
          })
        })
      })
    },
    close: async () => {
      if (container) {
        await container.stop()
        if (connection.options?.autoRemove) {
          await container.remove()
        }
        container = null
      }
    },
    onmessage: () => {},
    onerror: () => {},
  }
}

export const createDockerTransport = (
  connection: Readonly<
    ContainerPerRequestConnection | PersistentContainerConnection
  >
): Readonly<Transport> => {
  if (
    'strategy' in connection &&
    connection.strategy === 'container-per-request'
  ) {
    return createContainerPerRequestTransport(connection)
  }
  return createPersistentContainerTransport(connection)
}
