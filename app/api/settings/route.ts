import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const apiKeyHeader = req.headers.get("x-ai-key")
  const apiKey = apiKeyHeader || process.env.OPENAI_API_KEY
  const baseUrlHeader = req.headers.get("x-ai-base-url")
  const baseUrl =
    baseUrlHeader || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"

  if (!apiKey) {
    return NextResponse.json(
      {
        status: "error",
        message: "未提供 API Key",
      },
      { status: 400 },
    )
  }

  try {
    const url = baseUrl.replace(/\/+$/, "") + "/models"
    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!upstream.ok) {
      return NextResponse.json(
        {
          status: "error",
          message: "AI 服务返回异常，请检查 Key 或网络。",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "无法连接到 AI 服务，请稍后再试。",
      },
      { status: 500 },
    )
  }
}
