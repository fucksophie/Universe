import {generate} from "ts-to-zod";

const messageTypes = await Bun.file("src/MessageTypes.ts").text();

const schema = generate({
    sourceText: messageTypes
});
let rawSchema = schema.getZodSchemasFile("src/MessageTypes.ts")
rawSchema = rawSchema.replace("x: z.number(),", "x: z.coerce.number(),")
rawSchema = rawSchema.replace("y: z.number()", "y: z.coerce.number()")
const file = Bun.file("src/MessageTypesSchema.ts");
const writer = file.writer();
writer.start()
writer.write(rawSchema);
writer.end();