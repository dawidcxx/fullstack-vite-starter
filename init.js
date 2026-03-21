import readline from "readline/promises";
import { readdir, readFile, writeFile } from "fs/promises";
import { stdin as input, stdout as output } from "process";

const IGNORE = new Set(["node_modules", ".git", ".direnv"]);
const PLACEHOLDER = "the_application_name";

const argProjectName = process.argv[2]?.trim();
const rl = readline.createInterface({ input, output });

const newProjectName =
	argProjectName || (await rl.question("Enter new project name: ")).trim();

rl.close();

if (!newProjectName) {
	console.error("Project name cannot be empty.");
	process.exit(1);
}

const files = await walk(process.cwd());
let changedFiles = 0;

for (const file of files) {
	const changed = await replaceInFile(file, PLACEHOLDER, newProjectName);
	if (changed) changedFiles += 1;
}

console.log(
	`Done. Replaced \"${PLACEHOLDER}\" with \"${newProjectName}\" in ${changedFiles} file(s).`,
);

// Utils

async function walk(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		if (IGNORE.has(entry.name)) continue;

		const path = `${dir}/${entry.name}`;

		if (entry.isDirectory()) {
			files.push(...(await walk(path)));
		} else if (entry.isFile()) {
			files.push(path);
		}
	}

	return files;
}

async function replaceInFile(path, target, replacement) {
	try {
		const content = await readFile(path, "utf8");
		if (!content.includes(target)) return false;

		const nextContent = content.split(target).join(replacement);
		await writeFile(path, nextContent, "utf8");
		return true;
	} catch {
		// Skip non-text files or unreadable files.
		return false;
	}
}


