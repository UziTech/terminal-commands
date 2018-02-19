[![Build Status](https://travis-ci.org/UziTech/terminal-commands.svg?branch=master)](https://travis-ci.org/UziTech/terminal-commands)
[![Build status](https://ci.appveyor.com/api/projects/status/o0h54ouxl2jtvvfm?svg=true)](https://ci.appveyor.com/project/UziTech/terminal-commands)
[![Dependency Status](https://david-dm.org/UziTech/terminal-commands.svg)](https://david-dm.org/UziTech/terminal-commands)

# terminal-commands package

Setup commands to run in the terminal from the command palette.

**Note**  Depends on [platformio-ide-terminal](https://github.com/platformio/platformio-atom-ide-terminal) to run!

![screenshot](https://user-images.githubusercontent.com/97994/34861842-b3f0fbde-f72c-11e7-93bd-7b6e00141cf4.gif)

## Example

```js
// in ~/.atom/terminal-commands.json
{
  "echo:file": "echo ${file}",
  "echo:files": "echo ${files}",
  "echo:dir": "echo ${dir}"
}
```

![image](https://user-images.githubusercontent.com/97994/34899488-dde60bf4-f7be-11e7-98bd-71c8d922fa6b.png)

![image](https://user-images.githubusercontent.com/97994/34899525-1704ef86-f7bf-11e7-9088-d12d63ea2732.png)

## Placeholders

Certain placeholders can be used so commands can use current command target in the commands.
The command target will be the active editor if from the command palette, or selected files if from the tree-view context menu.

-   `${file}` - Replaced with the first target file path
-   `${files}` - Replaced with the targets file paths separated by space
-   `${dir}` - Replaced with the first target directory path
-   `${project}` - Replaced with the first target file's project path
