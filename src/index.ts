import { AppDataSource } from "./data-source";
import { File } from "./entity/File";

function sleep(sec: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), sec * 1000);
  });
}

async function getAndUpdate(reqId: number, updateToFileName: string) {
  console.log(reqId, "trying to get file 1 and update to", updateToFileName);
  await AppDataSource.transaction(async (tx) => {
    console.log(reqId, "trying to get file...\n");
    const file = await tx
      .getRepository(File)
      .createQueryBuilder()
      .setLock("pessimistic_write")
      .where("id = :id", { id: 1 })
      .getOneOrFail();
    console.log(reqId, "FOUND FILE", file.filename);
    await sleep(1);

    console.log(reqId, "updating filename to", updateToFileName);
    await tx
      .createQueryBuilder()
      .update(File)
      .set({ filename: updateToFileName })
      .where("id = :id", { id: 1 })
      .execute();

    console.log(reqId, "file updated.\n");
  });
}

AppDataSource.initialize()
  .then(async () => {
    const requests = [
      "first",
      "second",
      "third",
      "fourth",
      "fifth",
      "sixth",
      "seventh",
    ];

    await Promise.all(
      requests.map(async (req, reqId) => getAndUpdate(reqId, req))
    );

    await AppDataSource.destroy();
  })
  .catch((error) => console.log(error));
