const copyfiles = require("copyfiles");
const tsconfig = require("../../tsconfig.json");
copyfiles([...tsconfig.assets, tsconfig.compilerOptions.outDir], {}, () => {});
