import { readFileSync } from "fs"
import { resolve } from "path"
import { cwd } from "process"
import { dts } from "rollup-plugin-dts"
import typescript from "@rollup/plugin-typescript"
import resolveImports from "@rollup/plugin-node-resolve"

const pkg = JSON.parse(readFileSync(resolve(cwd(), "./package.json")).toString())

const input = "src/index.ts"
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {})
]
const created = `2026-${new Date().getFullYear()}`
const name = pkg.name.toUpperCase().replace("-", "_")
  .replace("@", "")
const banner = `/*
 * @author ${pkg.author}
 * {@link ${pkg.repository.url}}
 * @copyright  ${created} ${pkg.author}
 *
 * @license ${pkg.license}
 * @version ${pkg.version}
 */
 `
const plugins = [
  resolveImports({
    extensions: ['.js', '.ts']
  }),
  typescript({
    tsconfig: './.config/tsconfig.build.json'
  })
]
export default [{

  // UMD
  input,
  plugins,
  output: {
    file: "dist/index.umd.js",
    format: "umd",
    name,
    esModule: false,
    exports: "named",
    banner
  }
},
{

  // ESM
  input,
  external,
  plugins,
  output: {
    file: "dist/index.module.js",
    format: "esm",
    exports: "named",
    banner
  },
},
{

  // Declaration
  input: 'src/index.ts',
  external,
  plugins: [dts()],
  output: {
    file: "dist/index.d.ts",
    format: 'es',
    banner
  }
}]
