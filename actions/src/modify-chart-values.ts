import * as fs from "fs/promises";
import * as path from "path";
import * as YAML from "yaml";

import { getAppAlias } from "./chart-utils";

export async function setSuspendedState(chartPath: string, suspended: boolean) {
  const appAlias = await getAppAlias(chartPath);
  const valuesFilePath = path.join(chartPath, "values.yaml");
  const valuesFieleData = await fs.readFile(valuesFilePath, "utf-8");

  const document = YAML.parseDocument(valuesFieleData);
  const appNode = document.get(appAlias);

  if (!(appNode instanceof YAML.YAMLMap)) {
    throw new Error(`Invalid values file ${valuesFilePath}: expected '${appAlias}' node to be a map`);
  }
  if (appNode.has("suspended")) {
    appNode.set("suspended", suspended);
  } else {
    const pos = appNode.items.findIndex((elem) => elem.key.value == "fullnameOverride");
    const pair = new YAML.Pair(new YAML.Scalar("suspended"), new YAML.Scalar(suspended));
    appNode.items.splice(pos + 1, 0, pair);
    if (pos >= 0) {
      pair.key.spaceBefore = true;
    } else {
      appNode.items.at(pos + 2).key.spaceBefore = true;
    }
  }
  await fs.writeFile(valuesFilePath, document.toString());
}
