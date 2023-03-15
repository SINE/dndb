import { TextLineStream } from "https://deno.land/std@0.179.0/streams/mod.ts";
import { EventEmitter } from "node:events";

type Doc = Record<string, unknown>;

function existsFileSync(filename: string) {
  try {
    return Deno.lstatSync(filename).isFile;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return false;
    else throw err;
  }
}

/** Ensure datastore initialization on first load
 * @deprecated Replaced by fs.ensureFile.
 */
export async function init(filename: string) {
  if (!existsFileSync(filename)) {
    await Deno.writeFile(filename, new TextEncoder().encode(""));
  }
}

/** Write file line by line on a stream */
export class WriteFileStream extends EventEmitter {
  private file: Promise<Deno.FsFile>;
  private updatedFile: string;
  private readonly encoder = new TextEncoder();
  constructor(private filename: string) {
    super();
    console.log("WriteFileStream", filename);
    this.updatedFile = `${this.filename}.updated`;
    if (existsFileSync(this.updatedFile)) {
      console.log("WriteFileStream", "renaming updated file");
      this.file = new Promise((resolve) => {
        try {
          Deno.open(this.updatedFile, { write: true })
            .then(async (file) => {
              await file.close();
            })
            .then(() => {
              Deno.open(this.filename, { write: true })
                .then(async (file) => {
                  await file.close();
                })
                .then(async () => {
                  await Deno.renameSync(this.updatedFile, this.filename);
                  resolve(Deno.openSync(this.updatedFile, {
                    write: true,
                    create: true,
                  }));
                });
            });
        } catch (err) {
          console.log("WriteFileStream", "error renaming updated file", err);
          throw new Error("WriteFileStream - error renaming updated file");
        }
      });
    } else {
      console.log("WriteFileStream", "updated file does not exist yet");
      this.file = new Promise((resolve) =>
        resolve(Deno.openSync(this.updatedFile, {
          write: true,
          create: true,
        }))
      );
    }
  }
  public async write(data: Doc) {
    let thisfile;
    try {
      thisfile = await this.file;
    } catch (error) {
      return Promise.reject(error);
    }
    await thisfile.writeSync(this.encoder.encode(JSON.stringify(data) + "\n"));
    return Promise.resolve(true);
  }
  public async end() {
    const thisfile = await this.file;
    try {
      await thisfile.close();
    } catch (err) {
      console.log("WriteFileStream", "error closing file", err);
    }
    //    Deno.close(thisfile.rid);

    await Deno.rename(this.updatedFile, this.filename);
    this.emit("close");
  }
}

/** Append file line by line */
export async function writeFile(filename: string, data: Doc) {
  await ensureExists(filename);
  await Deno.writeFile(
    filename,
    new TextEncoder().encode(JSON.stringify(data) + "\n"),
    { append: true },
  );
}

/** Reads the datastore by streaming and buffering chunks */
export class ReadFileStream extends EventEmitter {
  private readonly decoder = new TextDecoder("utf-8");
  constructor(private filename: string, private bufSize?: number) {
    super();
    this.stream();
  }
  async stream() {
    console.log("ReadFileStream start");
    const file = await Deno.open(this.filename);
    for await (
      const chunk of file
        .readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream())
    ) {
      const json = chunk.match(/\{.*\}/) ?? undefined;
      if (!json) {
        continue;
      }
      this.emit("document", JSON.parse(json[0]));
    }
    this.emit("end");
  }
}

/** Ensures data if file doesn't exists */
async function ensureExists(filename: string) {
  if (!existsFileSync(filename)) {
    await check(() => existsFileSync(filename), 100);
  }
  return;
}

/** Check Polyfill */
function check(condition: () => boolean, checkTime: number) {
  return new Promise((resolve) => {
    const timerId = setInterval(() => {
      if (condition()) {
        clearInterval(timerId);
        resolve("done");
      }
    }, checkTime);
  });
}
