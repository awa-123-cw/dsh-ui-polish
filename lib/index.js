// dsh-ui-polish — Host 半。
//
// 本插件是纯展示层：所有工作都在浏览器半（lib/client.js）完成——注入质感样式表，
// 并通过 client Service `theme.overrideTokens` 覆盖颜色 token。宿主侧不需要任何
// 服务、工具或持久化，因此这里只声明插件名与一个空的 apply。
export const name = 'dsh-ui-polish'

export function apply() {}
