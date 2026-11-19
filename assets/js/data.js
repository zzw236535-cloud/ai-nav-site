/* ============================================================
 * data.js  —  种子数据（纯 JS 对象，无网络请求，可 file:// 直接打开）
 * 说明：所有数据均可在「管理后台」中修改，修改后保存在浏览器 localStorage。
 * ============================================================ */

// ---------- 站点配置 ----------
const SITE_CONFIG = {
  name: 'AI 工具导航',
  slogan: '发现好用的 AI 工具，一站直达官网',
  description: '面向中文用户的 AI 工具发现与官网导流平台。按分类浏览、搜索与收藏，快速找到合适的 AI 工具。',
  keywords: 'AI工具,人工智能,AI导航,AI写作,AI绘画,AI编程',
  contact: {
    email: 'business@example.com',
    wechat: 'ai-nav-biz',
    note: '以上为示例联系方式，请在管理后台「站点设置」中替换为真实信息。'
  }
};

// ---------- 八大分类 ----------
const CATEGORIES = [
  { id: 'chat',    name: 'AI 对话',    icon: '💬', desc: '综合问答、信息整理与日常助手', tags: ['中文对话', '联网问答', '多模态'], order: 1, status: 'on' },
  { id: 'writing', name: 'AI 写作',    icon: '✍️', desc: '文案、改写、翻译与长文辅助', tags: ['营销文案', '翻译', '改写润色'], order: 2, status: 'on' },
  { id: 'image',   name: 'AI 绘画',    icon: '🎨', desc: '图像生成、图片编辑与设计辅助', tags: ['文生图', '图片编辑', '设计辅助'], order: 3, status: 'on' },
  { id: 'video',   name: 'AI 视频',    icon: '🎬', desc: '视频生成、剪辑辅助与字幕处理', tags: ['文生视频', '视频剪辑', '字幕'], order: 4, status: 'on' },
  { id: 'audio',   name: 'AI 音频',    icon: '🎧', desc: '配音、语音处理与音乐创作', tags: ['语音合成', '音频处理', '音乐创作'], order: 5, status: 'on' },
  { id: 'code',    name: 'AI 编程',    icon: '💻', desc: '代码辅助、开发工具与测试辅助', tags: ['代码补全', '代码审查', '开发工具'], order: 6, status: 'on' },
  { id: 'office',  name: 'AI 办公',    icon: '📊', desc: '文档、演示、表格与会议整理', tags: ['演示制作', '会议纪要', '文档协作'], order: 7, status: 'on' },
  { id: 'learn',   name: 'AI 学习研究', icon: '📚', desc: '知识整理、阅读与研究辅助', tags: ['论文阅读', '知识管理', '文献检索'], order: 8, status: 'on' }
];

// ---------- 工具数据 ----------
// 字段：id, name, icon, url(官网), cats[], tags[], summary, detail, features[], scenes[], pricing, featured, addedAt, verifiedAt, status
const TOOLS = [
  // ===== AI 对话 =====
  { id:'chatgpt', name:'ChatGPT', icon:'🟢', url:'https://chatgpt.com', cats:['chat','writing','learn'], tags:['海外','联网问答','多模态'], summary:'OpenAI 推出的通用对话助手，擅长问答、写作与推理。', detail:'ChatGPT 是 OpenAI 的旗舰对话模型，支持文字、图片与文件输入，适用于日常问答、内容创作、代码辅助与资料整理。免费版提供基础能力，订阅版可使用更强的模型与更高额度。', features:['多轮对话与上下文记忆','图片与文件分析','联网搜索与数据处理'], scenes:['日常问答','文案起草','学习辅导'], pricing:'免费 + 付费订阅（以官网为准）', featured:true, addedAt:'2026-01-12', verifiedAt:'2026-11-10', status:'on' },
  { id:'claude', name:'Claude', icon:'🟠', url:'https://claude.ai', cats:['chat','writing','code'], tags:['海外','长文写作','代码'], summary:'Anthropic 的对话模型，长文本理解与写作表现突出。', detail:'Claude 以长上下文和细致写作见长，适合处理长文档、深度分析与高质量文案，也被广泛用于代码审查与 Agent 开发。', features:['超长上下文','文档阅读与分析','Artifacts 内容预览'], scenes:['长文写作','文档分析','代码审查'], pricing:'免费 + 付费订阅（以官网为准）', featured:true, addedAt:'2026-01-15', verifiedAt:'2026-11-10', status:'on' },
  { id:'doubao', name:'豆包', icon:'🔵', url:'https://www.doubao.com', cats:['chat','image','office'], tags:['中文对话','免费','多模态'], summary:'字节跳动旗下的 AI 助手，中文体验流畅、功能丰富。', detail:'豆包提供对话、识图、写作、翻译等能力，对中文场景优化良好，适合日常办公、学习和创作使用。', features:['中文对话与自然语音','图片识别','写作与翻译助手'], scenes:['日常助手','学习辅导','图片识别'], pricing:'免费为主（以官网为准）', featured:true, addedAt:'2026-02-03', verifiedAt:'2026-11-08', status:'on' },
  { id:'tongyi', name:'通义千问', icon:'🟣', url:'https://tongyi.aliyun.com', cats:['chat','office','code'], tags:['中文对话','阿里','多模态'], summary:'阿里云推出的大模型助手，支持文档、图片与代码处理。', detail:'通义千问支持多轮对话、文档阅读、图片理解与代码辅助，并与其他阿里云产品联动，适合办公与开发场景。', features:['文档与网页解读','多模态理解','插件生态'], scenes:['办公辅助','资料整理','代码辅助'], pricing:'免费 + 增值服务（以官网为准）', featured:false, addedAt:'2026-02-10', verifiedAt:'2026-11-08', status:'on' },
  { id:'wenxin', name:'文心一言', icon:'🔷', url:'https://yiyan.baidu.com', cats:['chat','writing','image'], tags:['中文对话','百度','多模态'], summary:'百度推出的中文大模型助手，搜索与生成能力结合。', detail:'文心一言具备知识问答、文学创作、逻辑推理和多模态生成能力，与百度搜索生态结合紧密。', features:['中文知识问答','多模态生成','插件与智能体'], scenes:['信息查询','文案创作','学习辅助'], pricing:'免费 + 会员（以官网为准）', featured:false, addedAt:'2026-02-12', verifiedAt:'2026-11-08', status:'on' },
  { id:'kimi', name:'Kimi', icon:'🌙', url:'https://www.kimi.com', cats:['chat','learn','office'], tags:['中文对话','长文本','文件阅读'], summary:'月之暗面出品，擅长长文本阅读与资料整理。', detail:'Kimi 支持超长文本输入与多文件解析，适合阅读长篇报告、论文与合同，并能联网检索资料。', features:['长文本阅读','多文件解析','联网检索'], scenes:['论文阅读','报告整理','资料检索'], pricing:'免费 + 付费（以官网为准）', featured:true, addedAt:'2026-03-01', verifiedAt:'2026-11-06', status:'on' },
  { id:'deepseek', name:'DeepSeek', icon:'🐳', url:'https://chat.deepseek.com', cats:['chat','code','learn'], tags:['中文对话','推理','代码'], summary:'深度求索的对话模型，推理与代码能力受到广泛关注。', detail:'DeepSeek 提供对话与深度思考模式，在数学推理、代码生成和中文理解方面表现突出，支持网页与 App 使用。', features:['深度思考推理','代码生成','中文理解'], scenes:['逻辑推理','编程辅助','学习研究'], pricing:'免费（以官网为准）', featured:true, addedAt:'2026-03-05', verifiedAt:'2026-11-06', status:'on' },
  { id:'gemini', name:'Gemini', icon:'⭐', url:'https://gemini.google.com', cats:['chat','image','learn'], tags:['海外','多模态','Google'], summary:'Google 的多模态 AI 助手，与 Google 生态深度整合。', detail:'Gemini 支持文字、图片、音频与视频输入，与 Gmail、Docs 等 Google 服务协作，适合研究与办公。', features:['原生多模态','Google 生态联动','长上下文'], scenes:['研究辅助','办公协作','多模态问答'], pricing:'免费 + 付费（以官网为准）', featured:false, addedAt:'2026-03-10', verifiedAt:'2026-11-05', status:'on' },
  { id:'glm', name:'智谱清言', icon:'🟦', url:'https://www.zhipuai.cn', cats:['chat','code','office'], tags:['中文对话','智谱AI','Agent'], summary:'智谱 AI 的对话助手，支持智能体与多模态能力。', detail:'智谱清言提供通用对话、文档解析与智能体中心，覆盖办公、学习与开发等多种场景。', features:['智能体中心','文档解析','多模态交互'], scenes:['办公辅助','智能体探索','学习'], pricing:'免费 + 付费（以官网为准）', featured:false, addedAt:'2026-03-18', verifiedAt:'2026-11-04', status:'on' },
  { id:'spark', name:'讯飞星火', icon:'🟥', url:'https://xinghuo.xfyun.cn', cats:['chat','audio','office'], tags:['中文对话','语音','科大讯飞'], summary:'科大讯飞的认知大模型，语音能力与教育场景见长。', detail:'讯飞星火具备语音识别与合成优势，广泛用于教育、办公与智能硬件场景。', features:['语音交互','教育场景优化','多模态'], scenes:['学习辅导','语音助手','办公'], pricing:'免费 + 会员（以官网为准）', featured:false, addedAt:'2026-03-20', verifiedAt:'2026-11-04', status:'on' },

  // ===== AI 写作 =====
  { id:'jasper', name:'Jasper', icon:'✒️', url:'https://www.jasper.ai', cats:['writing'], tags:['海外','营销文案','品牌'], summary:'面向营销团队的 AI 文案工具，强调品牌语气一致性。', detail:'Jasper 提供营销文案生成、品牌声音管理与团队协作功能，适合市场团队批量产出内容。', features:['品牌语气定制','营销模板库','团队协作'], scenes:['广告文案','品牌内容','营销活动'], pricing:'付费订阅（以官网为准）', featured:false, addedAt:'2026-04-02', verifiedAt:'2026-11-03', status:'on' },
  { id:'copyai', name:'Copy.ai', icon:'📝', url:'https://www.copy.ai', cats:['writing'], tags:['海外','营销文案','模板'], summary:'templates 丰富的 AI 文案生成工具，适合销售与营销。', detail:'Copy.ai 提供大量营销与销售模板，可快速生成邮件、社媒文案与产品描述。', features:['丰富模板','销售文案','工作流自动化'], scenes:['邮件撰写','社媒内容','产品描述'], pricing:'免费 + 付费（以官网为准）', featured:false, addedAt:'2026-04-05', verifiedAt:'2026-11-03', status:'on' },
  { id:'notionai', name:'Notion AI', icon:'🖤', url:'https://www.notion.com/product/ai', cats:['writing','office','learn'], tags:['海外','文档协作','笔记'], summary:'集成在 Notion 中的 AI 写作与知识管理助手。', detail:'Notion AI 可在文档内直接生成、改写与总结内容，并与数据库和知识库协作。', features:['文档内写作','内容总结','知识库检索'], scenes:['笔记整理','团队协作','知识管理'], pricing:'付费增值（以官网为准）', featured:false, addedAt:'2026-04-08', verifiedAt:'2026-11-02', status:'on' },
  { id:'writexie', name:'秘塔写作猫', icon:'🐱', url:'https://xiezuocat.com', cats:['writing'], tags:['中文','校对','改写'], summary:'中文写作辅助工具，提供纠错、润色与改写。', detail:'秘塔写作猫专注于中文文本的错别字检查、语法纠错与风格润色，适合编辑与学生。', features:['错别字检查','语法纠错','文风润色'], scenes:['文章校对','公文润色','论文改写'], pricing:'免费 + 会员（以官网为准）', featured:false, addedAt:'2026-04-12', verifiedAt:'2026-11-02', status:'on' },
  { id:'ibilng', name:'笔灵AI', icon:'🖊️', url:'https://ibiling.cn', cats:['writing'], tags:['中文','公文','论文'], summary:'面向中文场景的写作助手，覆盖公文、论文与文案。', detail:'笔灵 AI 提供多类中文写作模板，适用于公文撰写、论文辅助与自媒体文案。', features:['场景化模板','公文辅助','续写扩写'], scenes:['公文写作','论文辅助','自媒体'], pricing:'免费 + 会员（以官网为准）', featured:false, addedAt:'2026-04-15', verifiedAt:'2026-11-01', status:'on' },
  { id:'grammarly', name:'Grammarly', icon:'✅', url:'https://www.grammarly.com', cats:['writing'], tags:['海外','英文校对','语法'], summary:'英文写作校对工具，检查语法、拼写与表达。', detail:'Grammarly 支持浏览器与编辑器插件，实时检查英文语法、拼写和语气，适合英文写作与邮件。', features:['实时语法检查','语气调整','跨应用插件'], scenes:['英文邮件','学术写作','商务沟通'], pricing:'免费 + 付费（以官网为准）', featured:false, addedAt:'2026-04-18', verifiedAt:'2026-11-01', status:'on' },

  // ===== AI 绘画 =====
  { id:'midjourney', name:'Midjourney', icon:'🖼️', url:'https://www.midjourney.com', cats:['image'], tags:['海外','文生图','艺术'], summary:'以高审美图像生成著称的 AI 绘画工具。', detail:'Midjourney 通过文字提示生成高质量图像，风格化能力强，广泛用于创意设计与艺术探索。', features:['高质量图像生成','风格参考','社区作品探索'], scenes:['创意设计','概念图','艺术创作'], pricing:'付费订阅（以官网为准）', featured:true, addedAt:'2026-05-01', verifiedAt:'2026-10-30', status:'on' },
  { id:'stablediff', name:'Stable Diffusion', icon:'🎭', url:'https://stability.ai', cats:['image'], tags:['海外','文生图','开源'], summary:'开源图像生成模型，支持本地部署与精细控制。', detail:'Stable Diffusion 是可本地部署的开源图像生成模型，配合 ControlNet 等插件实现精细创作控制。', features:['开源可本地部署','插件生态','精细控制'], scenes:['图像创作','设计辅助','模型研究'], pricing:'开源免费（部署成本自负）', featured:false, addedAt:'2026-05-05', verifiedAt:'2026-10-30', status:'on' },
  { id:'dalle', name:'DALL·E', icon:'🥚', url:'https://openai.com/index/dall-e-3/', cats:['image'], tags:['海外','文生图','OpenAI'], summary:'OpenAI 的图像生成模型，提示词理解准确。', detail:'DALL·E 可根据自然语言生成图像，与 ChatGPT 集成，适合快速生成插画与示意图。', features:['文字准确渲染','与 ChatGPT 集成','风格变体'], scenes:['插画生成','示意图','创意探索'], pricing:'按量/订阅（以官网为准）', featured:false, addedAt:'2026-05-08', verifiedAt:'2026-10-29', status:'on' },
  { id:'wanxiang', name:'通义万相', icon:'🌈', url:'https://tongyi.aliyun.com/wanxiang', cats:['image'], tags:['中文','文生图','阿里'], summary:'阿里云的图像生成工具，支持中文提示与多种风格。', detail:'通义万相支持文生图、图生图与图像编辑，对中文提示词理解友好。', features:['中文提示生成','图像编辑','多风格模板'], scenes:['电商配图','创意设计','中文创作'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-05-12', verifiedAt:'2026-10-28', status:'on' },
  { id:'yige', name:'文心一格', icon:'🖌️', url:'https://yige.baidu.com', cats:['image'], tags:['中文','文生图','百度'], summary:'百度推出的 AI 艺术创作平台。', detail:'文心一格提供文生图与图像创意工具，支持国风、油画等多种风格。', features:['艺术风格生成','创意画布','作品社区'], scenes:['艺术探索','设计灵感','娱乐创作'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-05-15', verifiedAt:'2026-10-28', status:'on' },
  { id:'leonardo', name:'Leonardo.Ai', icon:'🦁', url:'https://leonardo.ai', cats:['image'], tags:['海外','文生图','游戏素材'], summary:'面向创作者的图像生成平台，适合游戏与 Design 素材。', detail:'Leonardo.Ai 提供图像生成与模型训练能力，在游戏资产与产品设计领域应用较多。', features:['自定义模型','生成画布','素材管理'], scenes:['游戏美术','产品设计','概念图'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-05-18', verifiedAt:'2026-10-27', status:'on' },
  { id:'canva', name:'Canva', icon:'🎨', url:'https://www.canva.com', cats:['image','office'], tags:['海外','设计模板','协作'], summary:'在线设计平台，集成 AI 图片与设计助手。', detail:'Canva 提供海量模板与 AI 设计功能，适合海报、演示与社交媒体图片制作。', features:['海量模板','AI 图片生成','团队协作'], scenes:['海报设计','社媒配图','演示制作'], pricing:'免费 + 付费（以官网为准）', featured:false, addedAt:'2026-05-20', verifiedAt:'2026-10-27', status:'on' },
  { id:'firefly', name:'Adobe Firefly', icon:'🔥', url:'https://firefly.adobe.com', cats:['image'], tags:['海外','设计辅助','Adobe'], summary:'Adobe 的生成式 AI 设计工具，商用友好。', detail:'Firefly 与 Photoshop、Illustrator 深度集成，支持文生图、生成填充与风格匹配。', features:['生成式填充','Adobe 生态集成','商用授权清晰'], scenes:['平面设计','图片编辑','商业素材'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-05-22', verifiedAt:'2026-10-26', status:'on' },

  // ===== AI 视频 =====
  { id:'sora', name:'Sora', icon:'🌀', url:'https://openai.com/index/sora/', cats:['video'], tags:['海外','文生视频','OpenAI'], summary:'OpenAI 的视频生成模型，可生成连贯场景视频。', detail:'Sora 可根据文字生成具有连贯运动的视频片段，面向创意视频与内容探索。', features:['文生视频','场景连贯性','多分辨率输出'], scenes:['创意短片','概念视频','内容探索'], pricing:'以官网为准', featured:true, addedAt:'2026-06-01', verifiedAt:'2026-10-25', status:'on' },
  { id:'runway', name:'Runway', icon:'🎞️', url:'https://runwayml.com', cats:['video'], tags:['海外','视频生成','剪辑'], summary:'AI 视频创作套件，支持文生视频与视频编辑。', detail:'Runway 提供 Gen 系列视频生成模型与多种视频编辑工具，被影视与创意行业广泛使用。', features:['文生视频/图生视频','视频编辑工具','运动画笔'], scenes:['短片创作','视频特效','广告创意'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-06-05', verifiedAt:'2026-10-25', status:'on' },
  { id:'kling', name:'可灵 AI', icon:'⚡', url:'https://klingai.kuaishou.com', cats:['video'], tags:['中文','文生视频','快手'], summary:'快手推出的视频生成模型，中文体验友好。', detail:'可灵 AI 支持文生视频、图生视频与视频续写，在中文场景与国内访问上更便利。', features:['文生视频','图生视频','视频续写'], scenes:['短视频创作','广告素材','创意表达'], pricing:'免费额度 + 付费（以官网为准）', featured:true, addedAt:'2026-06-08', verifiedAt:'2026-10-24', status:'on' },
  { id:'jimeng', name:'即梦 AI', icon:'✨', url:'https://jimeng.jianying.com', cats:['video','image'], tags:['中文','文生视频','剪映'], summary:'剪映团队推出的 AI 创作工具，支持图片与视频生成。', detail:'即梦 AI 提供文生图、图生图与文生视频能力，与剪映生态衔接，适合短视频创作者。', features:['图片与视频生成','创作社区','剪映联动'], scenes:['短视频制作','创意视觉','内容创作'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-06-12', verifiedAt:'2026-10-24', status:'on' },
  { id:'pika', name:'Pika', icon:'🎬', url:'https://pika.art', cats:['video'], tags:['海外','文生视频','创意'], summary:'轻量的 AI 视频生成工具，操作直观。', detail:'Pika 支持通过提示词或图片生成短视频，并提供局部修改与风格化功能。', features:['文生视频','局部编辑','风格模板'], scenes:['创意短片','社媒视频','概念演示'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-06-15', verifiedAt:'2026-10-23', status:'on' },
  { id:'heygen', name:'HeyGen', icon:'🗣️', url:'https://www.heygen.com', cats:['video','audio'], tags:['海外','数字人','口播'], summary:'AI 数字人视频生成平台，适合口播与培训视频。', detail:'HeyGen 可通过文本生成数字人讲解视频，支持多语言与形象定制。', features:['AI 数字人','多语言配音','模板化制作'], scenes:['企业培训','营销口播','产品讲解'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-06-18', verifiedAt:'2026-10-23', status:'on' },
  { id:'capcut', name:'剪映 / CapCut', icon:'✂️', url:'https://www.capcut.com', cats:['video'], tags:['中文','视频剪辑','字幕'], summary:'广受欢迎的 video 剪辑工具，集成 AI 字幕与特效。', detail:'剪映提供智能字幕、自动剪辑与 AI 特效，是短视频创作的常用工具。', features:['智能字幕','一键成片','AI 特效'], scenes:['短视频剪辑','字幕处理','内容创作'], pricing:'免费 + 会员（以官网为准）', featured:false, addedAt:'2026-06-20', verifiedAt:'2026-10-22', status:'on' },
  { id:'vidu', name:'Vidu', icon:'🎥', url:'https://www.vidu.com', cats:['video'], tags:['中文','文生视频','生数科技'], summary:'国产视频生成模型，支持参考生视频。', detail:'Vidu 提供文生视频、图生视频与参考生视频能力，面向创作者与内容团队。', features:['参考视频生成','文生视频','一致性控制'], scenes:['创意视频','广告素材','内容创作'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-06-22', verifiedAt:'2026-10-22', status:'on' },

  // ===== AI 音频 =====
  { id:'elevenlabs', name:'ElevenLabs', icon:'🔊', url:'https://elevenlabs.io', cats:['audio'], tags:['海外','语音合成','配音'], summary:'语音合成质量领先的 AI 配音平台。', detail:'ElevenLabs 提供自然度高的文本转语音与声音克隆，常用于有声书、视频配音与播客。', features:['高质量 TTS','声音克隆','多语言'], scenes:['视频配音','有声内容','播客制作'], pricing:'免费额度 + 付费（以官网为准）', featured:true, addedAt:'2026-07-01', verifiedAt:'2026-10-21', status:'on' },
  { id:'suno', name:'Suno', icon:'🎵', url:'https://suno.com', cats:['audio'], tags:['海外','音乐创作','文生音乐'], summary:'通过提示词生成完整歌曲的 AI 音乐工具。', detail:'Suno 可根据文字描述生成带人声与伴奏的歌曲，适合音乐探索与内容配乐。', features:['文生歌曲','歌词生成','风格多样'], scenes:['音乐创作','视频配乐','灵感探索'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-07-05', verifiedAt:'2026-10-21', status:'on' },
  { id:'udio', name:'Udio', icon:'🎶', url:'https://www.udio.com', cats:['audio'], tags:['海外','音乐创作','音质'], summary:'AI 音乐生成平台，强调音质与多样性。', detail:'Udio 通过提示词生成音乐片段，支持延长与混音，适合创作者快速获得配乐素材。', features:['文生音乐','音质优化','作品管理'], scenes:['背景音乐','音乐灵感','内容配乐'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-07-08', verifiedAt:'2026-10-20', status:'on' },
  { id:'iflyrec', name:'讯飞听见', icon:'📻', url:'https://www.iflyrec.com', cats:['audio','office'], tags:['中文','语音转写','会议'], summary:'语音转文字与会议记录工具，中文识别准确。', detail:'讯飞听见提供录音转文字、实时转写与会议纪要整理，适合会议与访谈场景。', features:['语音转文字','实时转写','会议纪要'], scenes:['会议记录','访谈整理','字幕制作'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-07-12', verifiedAt:'2026-10-20', status:'on' },
  { id:'moyin', name:'魔音工坊', icon:'🎙️', url:'https://www.moyin.com', cats:['audio'], tags:['中文','配音','自媒体'], summary:'中文 AI 配音工具，适合自媒体与短视频。', detail:'魔音工坊提供多风格中文配音与音色选择，广泛用于短视频与自媒体内容制作。', features:['多风格音色','文本转语音','批量合成'], scenes:['短视频配音','自媒体','广告配音'], pricing:'免费 + 会员（以官网为准）', featured:false, addedAt:'2026-07-15', verifiedAt:'2026-10-19', status:'on' },
  { id:'descript', name:'Descript', icon:'🎧', url:'https://www.descript.com', cats:['audio','video'], tags:['海外','播客剪辑','转写'], summary:'通过编辑文字来剪辑音视频的工具。', detail:'Descript 将音视频转写为文本，用户可像编辑文档一样剪辑播客与视频。', features:['文本式剪辑','自动转写','Overdub 语音'], scenes:['播客制作','视频剪辑','访谈整理'], pricing:'免费 + 付费（以官网为准）', featured:false, addedAt:'2026-07-18', verifiedAt:'2026-10-19', status:'on' },

  // ===== AI 编程 =====
  { id:'copilot', name:'GitHub Copilot', icon:'🤖', url:'https://github.com/features/copilot', cats:['code'], tags:['海外','代码补全','GitHub'], summary:'GitHub 的 AI 编程助手，IDE 内代码补全与对话。', detail:'GitHub Copilot 在编辑器中提供实时代码补全、聊天与 Agent 能力，支持多种主流 IDE。', features:['实时代码补全','对话式编程','PR 辅助'], scenes:['日常开发','代码补全','代码理解'], pricing:'付费订阅（学生/开源可免费）', featured:true, addedAt:'2026-08-01', verifiedAt:'2026-10-18', status:'on' },
  { id:'cursor', name:'Cursor', icon:'🖱️', url:'https://www.cursor.com', cats:['code'], tags:['海外','AI IDE','代码编辑'], summary:'以 AI 为核心的编辑器，支持自然语言改代码。', detail:'Cursor 是基于 VS Code 的 AI 编辑器，支持代码库问答、多文件编辑与 Agent 模式。', features:['代码库问答','多文件编辑','Agent 模式'], scenes:['项目开发','代码重构','快速原型'], pricing:'免费 + 付费（以官网为准）', featured:true, addedAt:'2026-08-05', verifiedAt:'2026-10-18', status:'on' },
  { id:'claudecode', name:'Claude Code', icon:'⌨️', url:'https://www.anthropic.com/claude-code', cats:['code'], tags:['海外','Agent','终端'], summary:'Anthropic 的终端编程 Agent，自动完成开发任务。', detail:'Claude Code 在终端中运行，可读取代码库、编辑文件与执行命令，适合复杂开发任务。', features:['终端 Agent','代码库理解','任务自动化'], scenes:['复杂开发','代码重构','自动化任务'], pricing:'按用量计费（以官网为准）', featured:false, addedAt:'2026-08-08', verifiedAt:'2026-10-17', status:'on' },
  { id:'codegeex', name:'CodeGeeX', icon:'🧩', url:'https://codegeex.cn', cats:['code'], tags:['中文','代码补全','清华'], summary:'国产代码助手，支持多语言代码生成与补全。', detail:'CodeGeeX 提供代码补全、代码翻译与注释生成，支持多种主流编程语言与 IDE。', features:['代码补全','多语言支持','IDE 插件'], scenes:['日常开发','代码翻译','学习编程'], pricing:'免费（以官网为准）', featured:false, addedAt:'2026-08-12', verifiedAt:'2026-10-17', status:'on' },
  { id:'lingma', name:'通义灵码', icon:'🐉', url:'https://tongyi.aliyun.com/lingma', cats:['code'], tags:['中文','代码补全','阿里'], summary:'阿里云的智能编码助手，支持企业场景。', detail:'通义灵码提供代码补全、单元测试生成与研发问答，支持团队知识库定制。', features:['代码补全','单元测试生成','企业知识库'], scenes:['企业开发','代码审查','研发提效'], pricing:'免费 + 企业版（以官网为准）', featured:false, addedAt:'2026-08-15', verifiedAt:'2026-10-16', status:'on' },
  { id:'replit', name:'Replit', icon:'🔁', url:'https://replit.com', cats:['code'], tags:['海外','在线IDE','部署'], summary:'在线编程与部署平台，集成 AI 开发助手。', detail:'Replit 提供云端 IDE、协作与一键部署，配合 AI 助手可快速搭建并发布应用。', features:['云端 IDE','一键部署','AI 助手'], scenes:['快速原型','在线协作','教学'], pricing:'免费 + 付费（以官网为准）', featured:false, addedAt:'2026-08-18', verifiedAt:'2026-10-16', status:'on' },
  { id:'v0', name:'v0', icon:'⚡', url:'https://v0.dev', cats:['code','image'], tags:['海外','UI生成','Vercel'], summary:'通过提示词生成前端界面代码的工具。', detail:'v0 可根据自然语言或图片生成 React 界面代码，适合快速构建页面原型。', features:['UI 代码生成','组件预览','Vercel 集成'], scenes:['前端原型','界面设计','快速开发'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-08-20', verifiedAt:'2026-10-15', status:'on' },
  { id:'bolt', name:'Bolt.new', icon:'🔩', url:'https://bolt.new', cats:['code'], tags:['海外','全栈生成','StackBlitz'], summary:'浏览器内的 AI 全栈应用生成工具。', detail:'Bolt.new 在浏览器中通过提示词生成、运行并部署完整 Web 应用。', features:['全栈代码生成','浏览器内运行','一键部署'], scenes:['原型开发','快速验证','Web 应用'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-08-22', verifiedAt:'2026-10-15', status:'on' },

  // ===== AI 办公 =====
  { id:'m365copilot', name:'Microsoft 365 Copilot', icon:'🪟', url:'https://copilot.microsoft.com', cats:['office','writing'], tags:['海外','办公','微软'], summary:'集成在 Office 套件中的 AI 办公助手。', detail:'Copilot 在 Word、Excel、PowerPoint 与 Outlook 中提供写作、分析与演示辅助。', features:['文档写作','数据分析','演示生成'], scenes:['办公协作','数据整理','邮件处理'], pricing:'企业订阅（以官网为准）', featured:false, addedAt:'2026-09-01', verifiedAt:'2026-10-14', status:'on' },
  { id:'dingtalkai', name:'钉钉 AI', icon:'📌', url:'https://www.dingtalk.com', cats:['office'], tags:['中文','企业协作','阿里'], summary:'钉钉内置的 AI 助理，服务企业办公场景。', detail:'钉钉 AI 提供智能总结、文档写作与会议辅助，融入企业协作流程。', features:['会议总结','智能写作','流程辅助'], scenes:['企业办公','会议管理','协作'], pricing:'免费 + 企业版（以官网为准）', featured:false, addedAt:'2026-09-05', verifiedAt:'2026-10-14', status:'on' },
  { id:'feishuai', name:'飞书智能伙伴', icon:'🪶', url:'https://www.feishu.cn', cats:['office'], tags:['中文','企业协作','字节'], summary:'飞书生态的 AI 助手，覆盖文档与会议。', detail:'飞书智能伙伴支持文档创作、会议纪要与知识问答，提升团队协作效率。', features:['文档创作','会议纪要','知识检索'], scenes:['团队协作','会议整理','知识管理'], pricing:'免费 + 企业版（以官网为准）', featured:false, addedAt:'2026-09-08', verifiedAt:'2026-10-13', status:'on' },
  { id:'wpsai', name:'WPS AI', icon:'📄', url:'https://www.wps.cn', cats:['office'], tags:['中文','文档','金山'], summary:'WPS 办公套件的 AI 功能，支持文档与表格。', detail:'WPS AI 提供文档写作、表格公式与演示生成，集成在用户熟悉的办公软件中。', features:['文档助手','表格公式','演示生成'], scenes:['文档处理','表格分析','办公提效'], pricing:'免费 + 会员（以官网为准）', featured:false, addedAt:'2026-09-10', verifiedAt:'2026-10-13', status:'on' },
  { id:'gamma', name:'Gamma', icon:'📽️', url:'https://gamma.app', cats:['office','image'], tags:['海外','演示制作','设计'], summary:'AI 演示文稿与文档生成工具。', detail:'Gamma 可通过提示词快速生成美观的演示文稿与网页文档，支持在线协作。', features:['AI 生成演示','模板设计','在线协作'], scenes:['演示制作','汇报材料','教学课件'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-09-12', verifiedAt:'2026-10-12', status:'on' },
  { id:'tome', name:'Tome', icon:'📔', url:'https://tome.app', cats:['office'], tags:['海外','演示制作','叙事'], summary:'AI 叙事型演示与文档创作平台。', detail:'Tome 以叙事方式组织内容，自动生成演示页面，适合故事化表达。', features:['叙事型演示','AI 排版','协作分享'], scenes:['商业提案','故事叙述','教学'], pricing:'免费 + 付费（以官网为准）', featured:false, addedAt:'2026-09-15', verifiedAt:'2026-10-12', status:'on' },
  { id:'otter', name:'Otter.ai', icon:'🦦', url:'https://otter.ai', cats:['office','audio'], tags:['海外','会议记录','转写'], summary:'实时会议转写与纪要工具。', detail:'Otter.ai 提供实时语音转写、说话人识别与会议摘要，适合远程会议记录。', features:['实时转写','说话人识别','会议摘要'], scenes:['会议记录','访谈','课堂笔记'], pricing:'免费 + 付费（以官网为准）', featured:false, addedAt:'2026-09-18', verifiedAt:'2026-10-11', status:'on' },

  // ===== AI 学习研究 =====
  { id:'notebooklm', name:'NotebookLM', icon:'📓', url:'https://notebooklm.google.com', cats:['learn','writing'], tags:['海外','知识管理','Google'], summary:'Google 的 AI 研究助手，基于你的资料回答与总结。', detail:'NotebookLM 可上传资料并据此生成摘要、问答与播客，强调来源可追溯。', features:['资料驱动问答','来源引用','音频概览'], scenes:['文献研究','资料整理','学习复习'], pricing:'免费 + 付费（以官网为准）', featured:true, addedAt:'2026-10-01', verifiedAt:'2026-10-10', status:'on' },
  { id:'perplexity', name:'Perplexity', icon:'🔍', url:'https://www.perplexity.ai', cats:['learn','chat'], tags:['海外','AI搜索','引用'], summary:'带来源引用的 AI 搜索引擎。', detail:'Perplexity 结合搜索与大模型，回答中附带来源链接，适合事实核查与研究。', features:['实时搜索','来源引用','聚焦模式'], scenes:['资料检索','事实核查','研究辅助'], pricing:'免费 + 付费（以官网为准）', featured:false, addedAt:'2026-10-05', verifiedAt:'2026-10-10', status:'on' },
  { id:'metaso', name:'秘塔 AI 搜索', icon:'🧭', url:'https://metaso.cn', cats:['learn'], tags:['中文','AI搜索','无广告'], summary:'中文 AI 搜索工具，结构化呈现资料与大纲。', detail:'秘塔 AI 搜索提供无广告的搜索体验，自动生成大纲与来源，适合研究与学习。', features:['中文搜索','结构化大纲','来源追溯'], scenes:['资料检索','学习研究','写作调研'], pricing:'免费 + 会员（以官网为准）', featured:false, addedAt:'2026-10-08', verifiedAt:'2026-10-09', status:'on' },
  { id:'elicit', name:'Elicit', icon:'🔬', url:'https://elicit.org', cats:['learn'], tags:['海外','论文阅读','文献综述'], summary:'用 AI 辅助文献综述与论文筛选的研究工具。', detail:'Elicit 可帮助研究者查找论文、提取关键信息并进行文献综述。', features:['论文检索','信息提取','文献综述'], scenes:['学术研究','文献综述','论文筛选'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-10-10', verifiedAt:'2026-10-09', status:'on' },
  { id:'consensus', name:'Consensus', icon:'🤝', url:'https://consensus.app', cats:['learn'], tags:['海外','论文搜索','证据'], summary:'基于科研证据回答问题的搜索工具。', detail:'Consensus 从论文中提取证据回答研究问题，适合循证研究与学术查询。', features:['证据驱动回答','论文摘要','引用追踪'], scenes:['学术研究','循证查询','论文阅读'], pricing:'免费额度 + 付费（以官网为准）', featured:false, addedAt:'2026-10-12', verifiedAt:'2026-10-08', status:'on' },
  { id:'cnki', name:'CNKI 研学', icon:'🎓', url:'https://xueshu.cnki.net', cats:['learn'], tags:['中文','文献管理','知网'], summary:'知网旗下的文献阅读与研究辅助平台。', detail:'CNKI 研学提供文献检索、阅读与笔记管理，服务中文学术研究场景。', features:['中文文献检索','阅读笔记','文献管理'], scenes:['中文研究','文献管理','论文写作'], pricing:'机构/个人订阅（以官网为准）', featured:false, addedAt:'2026-10-14', verifiedAt:'2026-10-08', status:'on' },
  { id:'zotero', name:'Zotero', icon:'📚', url:'https://www.zotero.org', cats:['learn'], tags:['海外','文献管理','开源'], summary:'开源文献管理工具，配合 AI 插件提升研究效率。', detail:'Zotero 用于收集、整理与引用文献，社区提供多种 AI 增强插件。', features:['文献收集','引用管理','PDF 阅读'], scenes:['文献管理','论文写作','学术研究'], pricing:'开源免费（付费存储可选）', featured:false, addedAt:'2026-10-16', verifiedAt:'2026-10-07', status:'on' }
];

// ---------- 广告位定义 ----------
const AD_SLOTS = [
  { code:'A', name:'首页横幅', desc:'搜索区下方，单页最多一条', desktop:'1200×160', mobile:'750×240', page:'home' },
  { code:'B', name:'赞助工具位', desc:'列表前部，标注「赞助」', desktop:'图标 128×128', mobile:'图标 128×128', page:'list' },
  { code:'C', name:'分类横幅', desc:'对应分类列表上方', desktop:'1200×160', mobile:'750×240', page:'category' },
  { code:'D', name:'详情广告', desc:'正文结束后，与内容留白', desktop:'1200×200', mobile:'750×300', page:'detail' }
];

// ---------- 广告计划（示例数据，后台可编辑） ----------
// status: draft 草稿 / pending 待投放 / active 投放中 / paused 已暂停 / ended 已结束
// 时间使用北京时间，格式 YYYY-MM-DDTHH:mm
const AD_PLANS = [
  {
    id:'ad-demo-a', slot:'A', page:'home', title:'示例广告位 A · 首页横幅',
    desc:'这是一个演示广告。运营者可在后台替换为真实客户素材。',
    brand:'你的品牌', link:'https://example.com', priority:5, status:'active',
    start:'2026-01-01T00:00', end:'2027-12-31T23:59',
    bg:'linear-gradient(120deg,#2b2350,#1b2440)',
    desktopSize:'1200×160', mobileSize:'750×240'
  },
  {
    id:'ad-demo-b', slot:'B', page:'list', title:'示例赞助工具',
    desc:'演示赞助工具卡片，带明确「赞助」标识。',
    brand:'示例产品', link:'https://example.com', priority:5, status:'active',
    start:'2026-01-01T00:00', end:'2027-12-31T23:59',
    bg:'linear-gradient(135deg,#2a2140,#202840)',
    desktopSize:'图标 128×128', mobileSize:'图标 128×128'
  },
  {
    id:'ad-demo-c', slot:'C', page:'category', title:'示例广告位 C · 分类横幅',
    desc:'分类页专用横幅演示，按分类投放。',
    brand:'你的品牌', link:'https://example.com', priority:5, status:'active',
    start:'2026-01-01T00:00', end:'2027-12-31T23:59',
    bg:'linear-gradient(120deg,#1d2a44,#2b2140)',
    desktopSize:'1200×160', mobileSize:'750×240'
  },
  {
    id:'ad-demo-d', slot:'D', page:'detail', title:'示例广告位 D · 详情广告',
    desc:'详情页正文结束后的广告演示，与内容保持清晰间距。',
    brand:'你的品牌', link:'https://example.com', priority:5, status:'active',
    start:'2026-01-01T00:00', end:'2027-12-31T23:59',
    bg:'linear-gradient(120deg,#242040,#1a2a3a)',
    desktopSize:'1200×200', mobileSize:'750×300'
  }
];

// ---------- 管理员账号（演示用，仅前端校验） ----------
const ADMIN_ACCOUNT = { username:'admin', password:'admin123' };

// 暴露到全局（经典脚本，兼容 file://）
window.NAV_DATA = {
  SITE_CONFIG, CATEGORIES, TOOLS, AD_SLOTS, AD_PLANS, ADMIN_ACCOUNT
};
