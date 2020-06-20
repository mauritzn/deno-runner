export interface Project {
  folderPath: string;
  configPath: string;
  importMapPath: string;
  mainFilePath: string;
  runCommand: string[];
  config: ProjectConfig;
}
export interface ProjectConfig {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  main: string;
  unstableFlag: boolean;
  permissions: string[];
  imports?: ImportMap;
  [key: string]: string | string[] | boolean | ImportMap | undefined;
}
export interface ImportMap {
  [key: string]: string;
}
