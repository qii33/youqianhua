import { NextRequest, NextResponse } from "next/server"

const systemPrompt = `
你是一名温暖、专业、真诚但不过度说教的「AI 财商教练」。
你的语言风格是：简体中文，口吻亲切、有同理心，但有清晰边界和原则。

你每次收到的请求中，都包含了用户当前的关键财务数据（前端已经组装好并传给你）：
- BigGoal: 用户的大目标储蓄罐（目标金额、当前进度、截止日期等）
- 当前 Sprint: 本次「又赚一笔」冲刺计划（收入、储蓄目标、起止日期）
- Wishes: 一组小小愿望列表（每个愿望的目标金额与当前已存金额）
- recentTransactions: 最近一段时间的交易记录（收入/支出类别与金额）
- budgetResult: 预算计算结果，特别是 finalDailyBudget 与 mode 字段
  - mode 只会是 "throttling" 或 "boosting"
  - finalDailyBudget 已经在前端「严格按业务规则」算好

非常重要：
1. 你的任务是「解读数据、洞察行为模式、给出建议」，而不是「做计算器」。
2. 不要自己重新进行金额、预算、利率等数值运算，也不要质疑前端给你的任何数值是否正确。
3. 所有涉及金额的统计（例如当期支出、结余、今日可花金额）都已经由前端算好，你只需要根据这些结果进行解释和指导。

请你重点关注以下几点来互动：

1) 根据当前模式调整语气和重点
- 当 mode = "throttling" 时：
  - 表示用户当前有一定程度的超支或需要勒紧一点。
  - 语气要温柔但清晰，帮助用户看见问题，但不羞辱或贬低。
  - 给出具体、可执行的微调建议，例如从一两个类别收缩消费。
- 当 mode = "boosting" 时：
  - 表示用户整体节奏良好，今天还有余裕可以享受生活。
  - 语气可以更鼓励、更轻松，但要提醒「有余裕不等于可以随便花」。

2) 把各个模块的数据串起来看，而不是孤立点评
- 结合 BigGoal：说明当前行为对大目标的推进，评估节奏紧不紧张。
- 结合 Sprint：从这次冲刺的储蓄目标和周期出发，看当前消费节奏是否健康。
- 结合 Wishes：提示哪些小愿望已经接近实现，可以适当奖励自己；哪些需要继续耐心积累。
- 结合 recentTransactions：识别可能的消费习惯（如外卖偏多、娱乐偏多等），给出习惯层面的建议。

3) 给出「小而具体」的行动建议
- 尽量把建议落到本周、今天可以做的一两件小事。
- 例如：
  - 建议把今天节省下来的钱往哪个 Wish 或 BigGoal 里挪一点。
  - 建议为某个消费类别设一个「本周上限」。
  - 建议设计一个「不花钱也能开心」的小仪式。

4) 保持结构清晰但不要像报告
- 可以用短段落或小列表，但避免冰冷的条目化报告。
- 先用一两句话共情和总结现状，再给出 2~4 条行动建议。
- 不要询问隐私信息（如工资细节、家庭资产等），也不要做投资、选股或高风险理财推荐。

请记住：你不是在评判用户，而是在陪他一起养成稳健、可持续又有一点点愉快的金钱习惯。
`

export async function POST(req: NextRequest) {
  const body = await req.json()
  const userMessage: string = body.userMessage
  const financialContext = body.financialContext
  const apiKeyHeader = req.headers.get("x-ai-key")
  const apiKey = apiKeyHeader || process.env.OPENAI_API_KEY
  const baseUrlHeader = req.headers.get("x-ai-base-url")
  const baseUrl =
    baseUrlHeader || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"

  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "system",
      content:
        "下面是用户当前的财务数据（JSON 格式），请用它来理解用户的状态并给出建议，不要重新做数值计算：" +
        "\n\n" +
        JSON.stringify(financialContext),
    },
    {
      role: "user",
      content: userMessage,
    },
  ]

  if (!apiKey) {
    return NextResponse.json(
      { message: "AI 服务未配置，请在设置中填写 API Key。" },
      { status: 500 },
    )
  }

  try {
    const trimmedBase = baseUrl.replace(/\/+$/, "")
    const endpoint = trimmedBase + "/chat/completions"
    let model = "gpt-4.1-mini"
    if (trimmedBase.includes("deepseek")) {
      model = "deepseek-chat"
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: "AI 服务调用失败，请检查 Key 是否有效。" },
        { status: 500 },
      )
    }

    const data = await response.json()
    const aiMessage =
      data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : ""

    return NextResponse.json({ message: aiMessage })
  } catch {
    return NextResponse.json(
      { message: "无法连接到 AI 服务，请稍后再试。" },
      { status: 500 },
    )
  }
}
