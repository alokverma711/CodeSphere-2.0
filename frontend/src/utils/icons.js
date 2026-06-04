import { SiJavascript, SiReact, SiTypescript, SiHtml5, SiCss,
         SiSass, SiJson, SiMarkdown, SiPython, SiRuby, SiPhp,
         SiGo, SiRust, SiKotlin, SiSwift, SiCplusplus,
         SiVuedotjs, SiSvelte, SiDocker, SiGit, SiYaml,
         SiGnubash, SiPostgresql } from 'react-icons/si';
import { FaJava, FaFileCode, FaFilePdf, FaFileImage,
         FaFileArchive, FaFile, FaFolder, FaFolderOpen,
         FaLock, FaKey } from 'react-icons/fa';
import { TbBrandCSharp } from 'react-icons/tb';

const EXT_ICON_MAP = {
    js:         { Icon: SiJavascript,  color: '#F7DF1E' },
    mjs:        { Icon: SiJavascript,  color: '#F7DF1E' },
    cjs:        { Icon: SiJavascript,  color: '#F7DF1E' },
    jsx:        { Icon: SiReact,       color: '#61DAFB' },
    ts:         { Icon: SiTypescript,  color: '#3178C6' },
    tsx:        { Icon: SiReact,       color: '#61DAFB' },
    vue:        { Icon: SiVuedotjs,    color: '#41B883' },
    svelte:     { Icon: SiSvelte,      color: '#FF3E00' },
    html:       { Icon: SiHtml5,       color: '#E34C26' },
    htm:        { Icon: SiHtml5,       color: '#E34C26' },
    css:        { Icon: SiCss,         color: '#1572B6' },
    scss:       { Icon: SiSass,        color: '#CC6699' },
    sass:       { Icon: SiSass,        color: '#CC6699' },
    json:       { Icon: SiJson,        color: '#CBCB41' },
    yaml:       { Icon: SiYaml,        color: '#CB171E' },
    yml:        { Icon: SiYaml,        color: '#CB171E' },
    md:         { Icon: SiMarkdown,    color: '#519ABA' },
    mdx:        { Icon: SiMarkdown,    color: '#519ABA' },
    py:         { Icon: SiPython,      color: '#3572A5' },
    rb:         { Icon: SiRuby,        color: '#CC342D' },
    php:        { Icon: SiPhp,         color: '#777BB4' },
    java:       { Icon: FaJava,        color: '#B07219' },
    kt:         { Icon: SiKotlin,      color: '#7F52FF' },
    go:         { Icon: SiGo,          color: '#00ADD8' },
    rs:         { Icon: SiRust,        color: '#DEA584' },
    cpp:        { Icon: SiCplusplus,   color: '#F34B7D' },
    cc:         { Icon: SiCplusplus,   color: '#F34B7D' },
    cs:         { Icon: TbBrandCSharp, color: '#178600' },
    swift:      { Icon: SiSwift,       color: '#F05138' },
    sh:         { Icon: SiGnubash,     color: '#89E051' },
    bash:       { Icon: SiGnubash,     color: '#89E051' },
    zsh:        { Icon: SiGnubash,     color: '#89E051' },
    sql:        { Icon: SiPostgresql,  color: '#336791' },
    dockerfile: { Icon: SiDocker,      color: '#2496ED' },
    gitignore:  { Icon: SiGit,         color: '#F05033' },
    env:        { Icon: FaKey,         color: '#ECD53F' },
    lock:       { Icon: FaLock,        color: '#8D9DB6' },
    pdf:        { Icon: FaFilePdf,     color: '#E2574C' },
    png:        { Icon: FaFileImage,   color: '#A074C4' },
    jpg:        { Icon: FaFileImage,   color: '#A074C4' },
    jpeg:       { Icon: FaFileImage,   color: '#A074C4' },
    gif:        { Icon: FaFileImage,   color: '#A074C4' },
    svg:        { Icon: FaFileImage,   color: '#FF9900' },
    zip:        { Icon: FaFileArchive, color: '#BBBBBB' },
    gz:         { Icon: FaFileArchive, color: '#BBBBBB' },
    tar:        { Icon: FaFileArchive, color: '#BBBBBB' },
    xml:        { Icon: FaFileCode,    color: '#E34C26' },
    toml:       { Icon: FaFileCode,    color: '#9C4221' },
    ini:        { Icon: FaFileCode,    color: '#6D8086' },
};

export function resolveIcon(name) {
    if (!name) return { Icon: FaFile, color: '#90A4AE' };
    const lower = name.toLowerCase();
    if (lower === 'dockerfile') return { Icon: SiDocker, color: '#2496ED' };
    if (lower === '.gitignore' || lower === 'gitignore') return { Icon: SiGit, color: '#F05033' };
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    return EXT_ICON_MAP[ext] || { Icon: FaFile, color: '#90A4AE' };
}
