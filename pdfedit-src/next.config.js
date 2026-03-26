/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/pdfedit",
  assetPrefix: "/pdfedit/",
  trailingSlash: true,
  outputFileTracingRoot: __dirname,
}

module.exports = nextConfig
