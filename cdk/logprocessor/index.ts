import { CloudWatchLogsEvent, CloudWatchLogsDecodedData } from 'aws-lambda';
import * as db from "./db"
import * as zlib from 'zlib'

interface Record {
	transactionRequestId: string,
	hash: string,
	key: "K",
	value: "BEGIN_QUERY" | "END_QUERY",
	time: number,
	ms: number,
}

interface OutputRecord {
	date: string, // 2022-06-01 - pk
	recordType: string,
	sum: number,
	// Other metrics.
}

export const handler = async (event: CloudWatchLogsEvent): Promise<void> => {
	const payload = Buffer.from(event.awslogs.data, 'base64')
	const unzipped = zlib.gunzipSync(payload)
	const e = JSON.parse(unzipped.toString('ascii')) as CloudWatchLogsDecodedData

	for (let item of e.logEvents) {
		const record = JSON.parse(item.message) as Record;
		if (record.key && record.key != "K") {
			console.log({ msg: "log entry skipped, didn't have a K value" })
		}
		//TODO: Create a DB record if it's a transaction start.
		db.put(record.transactionRequestId, record.hash, record);
		//TODO: Put the data back into S3.
		if (record.value == "END_QUERY") {
			//TODO: Query the partition for the transactionrequestId.
			const o: OutputRecord = {
				date: (new Date()).toString(), // TODO: Round it down.
				recordType: "output",
				sum: 123,
			}
			await db.put(o.date, o.recordType, o);
		}
	}

	console.log(`Event: ${JSON.stringify(e, null, 2)}`);
};
