import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createTestClient, http, publicActions, walletActions } from 'viem'
import { foundry } from 'viem/chains'
import type { ApiResponse } from 'shared'
import { counterAbi } from 'contracts'

const app = new Hono()
app.use(cors())

const client = createTestClient({
  chain: foundry,
  mode: 'anvil',
  transport: http()
})
  .extend(publicActions)
  .extend(walletActions)

app.get("/hello", async (c) => {
  const response: ApiResponse = {
    message: "Hello bhvr!",
    success: true
  }
  return c.json(response)
})

app.get('/contracts/:address/counter', async (c) => {
  try {
    const address = c.req.param('address') as `0x${string}`

    const result = await client.readContract({
      address,
      abi: counterAbi,
      functionName: 'number'
    })

    const response: ApiResponse = {
      message: `Counter value: ${result}`,
      success: true
    }

    return c.json(response)
  } catch (error) {
    return c.json({
      message: 'Failed to read contract',
      success: false
    }, 500)
  }
})

export default app
