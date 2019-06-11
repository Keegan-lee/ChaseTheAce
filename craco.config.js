const CracoLessPlugin = require("craco-less");
const CracoAntDesignPlugin = require("craco-antd");

process.env.BROWSER = "none";

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          modifyVars: {
            "@primary-color": "#1DA57A",
            "@link-color": "#FEFEFA",
            "@layout-body-background": "#FEFEFA",
            "@layout-header-background": "#001529",
            "@processing-color": "@primary-color"
          },
          javascriptEnabled: true
        }
      }
    },
    {plugin: CracoAntDesignPlugin }
  ]
};