#!/usr/bin/env tsx

import { create } from './services'

const main = async () => {
  console.error('=== SERVER STARTING ===')
  console.error('Creating server...')
  const server = create()

  console.error('Starting server...')
  await server.start()
  console.error('=== SERVER READY ===')
  console.error('Listening for messages on stdin...')

  // Set up stdin handling
  process.stdin.setEncoding('utf8')
  process.stdin.on('readable', () => {
    console.error('>>> STDIN EVENT: readable')
    const chunk = process.stdin.read()
    if (chunk !== null) {
      console.error('>>> RECEIVED RAW DATA:')
      console.error(chunk)
      try {
        const message = JSON.parse(chunk)
        console.error('>>> PARSED REQUEST:')
        console.error(JSON.stringify(message, null, 2))
        console.error('>>> HANDLING REQUEST...')
        server.send(message)
      } catch (e) {
        console.error('!!! ERROR PARSING MESSAGE:')
        console.error(e)
      }
    }
  })

  process.stdin.on('end', () => {
    console.error('>>> STDIN EVENT: end - connection closed')
  })

  process.stdin.on('error', err => {
    console.error('!!! STDIN ERROR:')
    console.error(err)
  })

  process.stdout.on('error', err => {
    console.error('!!! STDOUT ERROR:')
    console.error(err)
  })

  process.stdout.on('drain', () => {
    console.error('>>> STDOUT EVENT: drain - buffer emptied')
  })

  // Ensure stdin is readable
  process.stdin.resume()
  console.error('>>> STDIN resumed and ready')
}

main().catch(error => {
  console.error('!!! SERVER ERROR:')
  console.error(error)
})
