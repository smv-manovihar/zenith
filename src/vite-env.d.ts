/// <reference types="vite/client" />

declare const __APP_VERSION__: string

declare module "@vitejs/plugin-react" {
  import type { Plugin, ResolvedConfig } from "vite"
  import type { ParserOptions, TransformOptions } from "@babel/core"

  export interface Options {
    include?: string | RegExp | Array<string | RegExp>
    exclude?: string | RegExp | Array<string | RegExp>
    jsxImportSource?: string
    jsxRuntime?: "classic" | "automatic"
    babel?:
      | BabelOptions
      | ((id: string, options: { ssr?: boolean }) => BabelOptions)
    reactRefreshHost?: string
  }

  export type BabelOptions = Omit<
    TransformOptions,
    "ast" | "filename" | "root" | "sourceFileName" | "sourceMaps" | "inputSourceMap"
  >

  export interface ReactBabelOptions extends BabelOptions {
    plugins: Extract<BabelOptions["plugins"], any[]>
    presets: Extract<BabelOptions["presets"], any[]>
    overrides: Extract<BabelOptions["overrides"], any[]>
    parserOpts: ParserOptions & {
      plugins: Extract<ParserOptions["plugins"], any[]>
    }
  }

  export type ReactBabelHook = (
    babelConfig: ReactBabelOptions,
    context: { ssr: boolean; id: string },
    config: ResolvedConfig
  ) => void

  export type ViteReactPluginApi = {
    reactBabel?: ReactBabelHook
  }

  export default function viteReact(opts?: Options): Plugin[]
}
