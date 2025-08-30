import { join } from "node:path";
import Keyv from "keyv";
import { beforeEach, describe, expect, it } from "vitest";
import { KeyvSqlite, createKeyv } from "./index";

const sqliteFile = join(process.cwd(), "runtime", "cache.sqlite3");

let sqliteKeyv: KeyvSqlite;

describe("KeyvSqlite", () => {
  beforeEach(async () => {
    sqliteKeyv = new KeyvSqlite({ uri: sqliteFile, busyTimeout: 3000 });

    await sqliteKeyv.clear();
  });

  it("getMany will return multiple values", async () => {
    await sqliteKeyv.set("foo", "bar");
    await sqliteKeyv.set("foo1", "bar1");
    await sqliteKeyv.set("foo2", "bar2");

    const values = await sqliteKeyv.getMany(["foo", "foo1", "foo2"]);
    expect(values).toStrictEqual(["bar", "bar1", "bar2"]);
  });

  it("deleteMany will delete multiple records", async () => {
    await sqliteKeyv.set("foo", "bar");
    await sqliteKeyv.set("foo1", "bar1");
    await sqliteKeyv.set("foo2", "bar2");

    const values = await sqliteKeyv.getMany(["foo", "foo1", "foo2"]);
    expect(values).toStrictEqual(["bar", "bar1", "bar2"]);

    await sqliteKeyv.deleteMany(["foo", "foo1", "foo2"]);
    const values1 = await sqliteKeyv.getMany(["foo", "foo1", "foo2"]);

    expect(values1).toStrictEqual([undefined, undefined, undefined]);
  });

  it("Async Iterator single element test", async () => {
    await sqliteKeyv.set("foo", "bar");
    const iterator = sqliteKeyv.iterator();

    for await (const [key, raw] of iterator) {
      expect(key).toBe("foo");
      expect(raw).toBe("bar");
    }
  });

  it("Async Iterator multiple element test", async () => {
    await sqliteKeyv.set("foo", "bar");
    await sqliteKeyv.set("foo1", "bar1");
    await sqliteKeyv.set("foo2", "bar2");

    const expectedEntries = [
      ["foo", "bar"],
      ["foo1", "bar1"],
      ["foo2", "bar2"],
    ];
    const iterator = sqliteKeyv.iterator();
    let i = 0;
    for await (const [key, raw] of iterator) {
      const [expectedKey, expectedRaw] = expectedEntries[i++];
      expect(key).toBe(expectedKey);
      expect(raw).toBe(expectedRaw);
    }
  });

  it("Async Iterator multiple elements with limit=1 test", async () => {
    await sqliteKeyv.set("foo", "bar");
    await sqliteKeyv.set("foo1", "bar1");
    await sqliteKeyv.set("foo2", "bar2");
    const iterator = sqliteKeyv.iterator();
    let key = await iterator.next();
    let [k, v] = key.value;
    expect(k).toBe("foo");
    expect(v).toBe("bar");
    key = await iterator.next();
    [k, v] = key.value;
    expect(k).toBe("foo1");
    expect(v).toBe("bar1");
    key = await iterator.next();
    [k, v] = key.value;
    expect(k).toBe("foo2");
    expect(v).toBe("bar2");
  });

  it("Async Iterator 0 element test", async () => {
    const iterator = sqliteKeyv.iterator("keyv");
    const key = await iterator.next();
    expect(key.value).toBe(undefined);
  });

  it("close connection successfully", async () => {
    expect(await sqliteKeyv.get("foo")).toBe(undefined);
    await sqliteKeyv.set("foo", "bar");
    expect(await sqliteKeyv.get("foo")).toBe("bar");
    await sqliteKeyv.disconnect();
    try {
      await sqliteKeyv.get("foo");
      expect.fail();
    } catch {
      expect(true).toBeTruthy();
    }
  });

  it("handling namespaces with multiple keyv instances", async () => {
    const storeA = new KeyvSqlite({ uri: sqliteFile });
    const storeB = new KeyvSqlite({ uri: sqliteFile });
    const keyvA = new Keyv({ store: storeA, namespace: "ns1" });
    const keyvB = new Keyv({ store: storeB, namespace: "ns2" });

    await keyvA.set("a", "x");
    await keyvA.set("b", "y");
    await keyvA.set("c", "z");

    await keyvB.set("a", "one");
    await keyvB.set("b", "two");
    await keyvB.set("c", "three");

    const resultA = await keyvA.get(["a", "b", "c"]);
    const resultB = await keyvB.get(["a", "b", "c"]);

    expect(resultA).toStrictEqual(["x", "y", "z"]);
    expect(resultB).toStrictEqual(["one", "two", "three"]);

    const iteratorResultA = new Map<string, string>();

    const iterator1 = keyvA.iterator ? keyvA.iterator("ns1") : undefined;
    if (iterator1) {
      for await (const [key, value] of iterator1) {
        iteratorResultA.set(key, value);
      }
    }

    expect(iteratorResultA).toStrictEqual(
      new Map([
        ["a", "x"],
        ["b", "y"],
        ["c", "z"],
      ]),
    );
  });

  it("will create a Keyv instance with a store", () => {
    const keyv = createKeyv();
    expect(keyv).toBeInstanceOf(Keyv);
  });
});
