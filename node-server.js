import 'dotenv/config'; // Automatically loads the .env file
import OpenAI from "openai";
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import http from 'http'
const bodyparser = import("body-parser")
const mv = import("mv")
const moveFile = import("move-file")
import {Server} from 'socket.io'
const uri = "mongodb://localhost:27017"
import upload from 'express-fileupload'
import fetch from 'node-fetch'
import fs from 'fs'
import cors from 'cors';
import {spawn} from "child_process";
import dns from 'dns'
import { MongoClient } from 'mongodb'
import nodemailer from 'nodemailer'
 // Enable command monitoring for debugging
/* 
const mongoClient = new MongoClient('mongodb+srv://shopmatesales:N6Npa7vcMIaBULIS@cluster0.mgv7t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { monitorCommands: true });
mongoClient.connect()// Enable command monitoring for debugging
*/
const mongoClient = new MongoClient(uri, { monitorCommands: true });
mongoClient.connect()// Enable command monitoring for debugging
//server calls management

import express from 'express'


const client = new OpenAI();

const {zlib} = import("node:zlib")

import { Readable, PassThrough } from "node:stream"

/**
 * Creates a ZIP file using zero dependencies, low-memory streaming, and native modules.
 * @param {Array<string>} filePaths - Array of absolute or relative file paths to compress
 * @param {string} outputPath - Target path for the output .zip file
 */
function nativeZipStream(filePaths, outputPath) {
    const outputStream = fs.createWriteStream(outputPath);
    const archiveStream = new PassThrough();
    archiveStream.pipe(outputStream);

    const centralDirectory = [];
    let currentOffset = 0;

    // Helper to calculate CRC32 on-the-fly using native zlib
    const calculateCrc32 = (filePath) => new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath);
        let crc = 0xFFFFFFFF; // CRC32 initial state

        stream.on('data', (chunk) => {
            crc = zlib.crc32(chunk, crc); // Leverages native performance
        });
        stream.on('end', () => resolve(crc ^ 0xFFFFFFFF));
        stream.on('error', reject);
    });

    // Main generator loop managing the stream sequentially to prevent memory spikes
    (async () => {
        try {
            for (const filePath of filePaths) {
                const stat = fs.statSync(filePath);
                const fileName = path.basename(filePath);
                const nameBuffer = Buffer.from(fileName, 'utf-8');
                
                // Fetch basic metadata & compute checksums
                const crc32 = await calculateCrc32(filePath);
                const localHeaderOffset = currentOffset;

                // 1. Gather sizes before compression
                const uncompressedSize = stat.size;
                let compressedSize = 0;

                // 2. Local File Header Structure
                const localHeader = Buffer.alloc(30);
                localHeader.writeUInt32LE(0x04034b50, 0); // Signature
                localHeader.writeUInt16LE(20, 4);         // Version needed to extract
                localHeader.writeUInt16LE(0, 6);          // General purpose bit flag
                localHeader.writeUInt16LE(8, 8);          // Compression method (8 = DEFLATE)
                localHeader.writeUInt16LE(0, 10);         // Last mod file time
                localHeader.writeUInt16LE(0, 12);         // Last mod file date
                localHeader.writeUInt32LE(crc32, 14);     // CRC-32
                // We'll update compressed/uncompressed sizes later if streaming dynamically, 
                // but since we know stat.size, we write uncompressed here.
                localHeader.writeUInt32LE(uncompressedSize, 22); // Uncompressed size
                localHeader.writeUInt16LE(nameBuffer.length, 26); // File name length
                localHeader.writeUInt16LE(0, 28);         // Extra field length

                // Write metadata to stream
                archiveStream.write(localHeader);
                archiveStream.write(nameBuffer);
                currentOffset += localHeader.length + nameBuffer.length;

                // 3. Compress and Stream file payload chunks directly
                const fileReadStream = fs.createReadStream(filePath);
                const deflater = zlib.createDeflateRaw({ level: 9 }); // Stream-level compression

                await new Promise((resolve, reject) => {
                    fileReadStream.pipe(deflater);
                    
                    deflater.on('data', (chunk) => {
                        compressedSize += chunk.length;
                        archiveStream.write(chunk);
                    });
                    
                    deflater.on('end', resolve);
                    deflater.on('error', reject);
                });

                currentOffset += compressedSize;

                // Save data references required for the trailing Central Directory
                centralDirectory.push({
                    fileName: nameBuffer,
                    crc32,
                    compressedSize,
                    uncompressedSize,
                    localHeaderOffset
                });
            }

            // 4. Generate Central Directory File Headers (Appended at the end of ZIP format)
            const centralDirStartOffset = currentOffset;
            let centralDirSize = 0;

            for (const file of centralDirectory) {
                const cdHeader = Buffer.alloc(46);
                cdHeader.writeUInt32LE(0x02014b50, 0); // Central directory signature
                cdHeader.writeUInt16LE(20, 4);         // Version made by
                cdHeader.writeUInt16LE(20, 6);         // Version needed to extract
                cdHeader.writeUInt16LE(0, 8);          // General purpose bit flag
                cdHeader.writeUInt16LE(8, 10);         // Compression method (DEFLATE)
                cdHeader.writeUInt16LE(0, 12);         // Last mod file time
                cdHeader.writeUInt16LE(0, 14);         // Last mod file date
                cdHeader.writeUInt32LE(file.crc32, 16); // CRC-32
                cdHeader.writeUInt32LE(file.compressedSize, 20); // Compressed size
                cdHeader.writeUInt32LE(file.uncompressedSize, 24); // Uncompressed size
                cdHeader.writeUInt16LE(file.fileName.length, 28);  // File name length
                cdHeader.writeUInt16LE(0, 30);         // Extra field length
                cdHeader.writeUInt16LE(0, 32);         // File comment length
                cdHeader.writeUInt16LE(0, 34);         // Disk number start
                cdHeader.writeUInt16LE(0, 36);         // Internal file attributes
                cdHeader.writeUInt32LE(0, 38);         // External file attributes
                cdHeader.writeUInt32LE(file.localHeaderOffset, 42); // Relative offset of local header

                archiveStream.write(cdHeader);
                archiveStream.write(file.fileName);
                centralDirSize += cdHeader.length + file.fileName.length;
            }

            // 5. End of Central Directory Record (EOCD)
            const eocd = Buffer.alloc(22);
            eocd.writeUInt32LE(0x06054b50, 0); // EOCD Signature
            eocd.writeUInt16LE(0, 4);          // Number of this disk
            eocd.writeUInt16LE(0, 6);          // Disk where central directory starts
            eocd.writeUInt16LE(centralDirectory.length, 8);  // Number of central dir records on this disk
            eocd.writeUInt16LE(centralDirectory.length, 10); // Total number of central dir records
            eocd.writeUInt32LE(centralDirSize, 12);          // Size of central directory
            eocd.writeUInt32LE(centralDirStartOffset, 16);   // Offset of central dir starting position
            eocd.writeUInt16LE(0, 20);         // Comment length

            archiveStream.write(eocd);
            archiveStream.end(); // Gracefully close pipeline
            console.log("Heavy-duty ZIP generation successfully complete.");

        } catch (error) {
            archiveStream.destroy(error);
            console.error("ZIP Generation Failed:", error);
        }
    })();
}
/*
// Example Usage
const filesToPack = ['./large_video.mp4', './logs.txt', './dataset.json'];
nativeZipStream(filesToPack, './vault_backup.zip');
*/
const app = express()

const server = http.createServer(app)

const port = process.env.port || 4000

const io = new Server(server)

import getDimensions from 'get-video-dimensions';

const tempDir = path.join(__dirname+"/TempHls")

app.use(cors())
app.use('/hls', express.static(tempDir))
app.use(express.json({limit:"1mb"}));
app.use(upload());
app.use(express.static(__dirname));
app.use(express.static(__dirname+'/Images'));
app.use(express.static(__dirname+'/Assets'));



//Date and time
let currentDate;
let currentMonth;
let currentMonthString;
let currentYear;
let currentHours;
let currentMins;

async function allocateTime(){
	
	let date = new Date()
	
	let months = ["January", "February", "March", "April" , "May" , "June" , "July" , "August" , "September" , "October" , "November" , "December"]
	
	currentDate = date.getDate();
	currentMonth = date.getMonth();
	currentYear = date.getFullYear();
	currentMonthString = months[currentMonth];
	currentHours = date.getHours();
	currentMins = date.getMinutes();
	
}

let serverTime = {
	"date":currentDate,
	"month":currentMonth,
	"year":currentYear,
	"hours":currentHours,
	"mins":currentMins
};

let dayTrack = 0

async function timeProcessor(){
	const now = new Date();
    const timezoneOffsetMinutes = now.getTimezoneOffset();
    
    // getTimezoneOffset() returns the difference in minutes between UTC and local time.
    // It returns a positive value if the local time zone is behind UTC (e.g., -120 for GMT+2)
    // and a negative value if the local time zone is ahead of UTC (e.g., 60 for GMT-1).
    // To get the offset in hours as we typically understand it (e.g., +2 for GMT+2),
    // we need to divide by -60.
    
    const timezoneOffsetHours = Math.round(timezoneOffsetMinutes / -60);
	
	allocateTime()
	
	serverTime["date"] = currentDate,
	serverTime["month"] = currentMonth,
	serverTime["year"] = currentYear,
	serverTime["hours"] = currentHours,
	serverTime["mins"] = currentMins
	serverTime["timezone"] = timezoneOffsetHours
	
	let d1 = serverTime.date
	let m1 = serverTime.month
	let y1 = serverTime.year
	
	if(
		d1 != dayTrack
	){
		dayTrack = d1
	}
	
	dayTrack = serverTime.date
	
}

function checkTime(date){
    let output = false 
    
    if(serverTime.timezone == date.timezone){
        if(
            serverTime.date == date.date &&
            serverTime.month == date.month &&
            serverTime.year == date.year
            ){
            output = true
        }
    }else{
        let utz = date.timezone 
        let stz = serverTime.timezone 
        let diff = utz-stz 
        let targetHours = serverTime.hours + diff
        if(
            serverTime.month == date.month &&
            serverTime.year == date.year
            ){
            if(date.date == serverTime.date){
                output = true
            }else{
                if(date.hours == targetHours || date.hours == targetHours+1 || date.hours == targetHours-1){
                    output = true
                }
            }
        }
    }
    
    return output
}	


app.post("/check-time",async(request,response)=>{
	let data = request.body
	
	await timeProcessor()
	
	console.log(serverTime,data)
	
	let check = checkTime(data)
	
	if( check == true){
		response.send(JSON.stringify({"status":true}))
	}else{
	    response.send(JSON.stringify({"status":false}))
	}
})

setInterval(async()=>{await timeProcessor()},1000)

async function getActiveUsers(){
    let output = null 
    
    try{
        let getSockets = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-sockets"})
		output = getSockets.body 
    }catch{
        output = null
    }
    return output
}

async function updateActiveSockets(sockets){
    try{
        await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"user-sockets"},{$set:{"body" : sockets}})
    }catch{
        console.log("An error occurred while processing user sockets")
    }
}

const activateUserSocket = async(userId,deviceId)=>{
    
	let activeUsers = await getActiveUsers()
    let search = activeUsers.find((activeUsers)=>{
        return activeUsers.userId === userId
    })
	if(deviceId === search.deviceId){		
		search.active = true
		await updateActiveSockets(activeUsers)
	}
	
	
}

const addUserSocket = async(userId,userType,ID)=>{
    let activeUsers = await getActiveUsers()
    let newObj = {
        "id":userId,
        "active": true,
        "mediaId": null,
        "mediaFormat": null,
        "currentJob": null,
        "currentForumPost": null,
		"jobId":null,
		"emailAddress":null,
		"deviceId":ID,
		"userType":userType
    }
    activeUsers.push(newObj)
    await updateActiveSockets(activeUsers)
}

const getUserSocket = async(userId)=>{
    var output = null 
    
    let activeSockets = await getActiveUsers()
    
    let search = activeSockets.find((activeSockets)=>{
        return activeSockets.userId === userId
    })
    if(search){
        output = search
    }
    
    return output
}

const getUserSocketObject = async(userId)=>{
    var output = null 
    
    let getSockets = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-sockets"})
	let sockets = getSockets.body
    
    let search = sockets.find((sockets)=>{
        return sockets.userId === userId
    })
    if(search){
        output = search
    }
    
    return output
}
const updateUserSocket = async(socket)=>{
    let getSockets = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-sockets"})
	let sockets = getSockets.body
    
    let index = sockets.findIndex((sockets)=>{
        return sockets.userId === socket.userId
    })
    sockets.splice(index,1,socket)
	
	await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"user-sockets"},{$set:{"body":sockets}})
}

const loginSocketFunction = async(userId)=>{
    let activeSockets = await getActiveUsers()
    
    let search = activeSockets.find((activeSockets)=>{
        return activeSockets.userId === userId
    })
    
    
    if(search){
        search.active = true
    }else{
        addUserSocket(userId) 
    }
    
    await updateActiveSockets(activeSockets)
}

const checkIfSocketActive = async(userId,deviceId)=>{
    let output = false
	
	let getSockets = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-sockets"})
    let activeSockets = getSockets.body
    let search = activeSockets.find((activeSockets)=>{
        return activeSockets.userId === userId
    })
	
	if(deviceId){		
		if(search){
			if(search.active == true && search.deviceId === deviceId){
				output = true
			}
		}
	}else{
		if(search){
			if(search.active == true && search.alreadyLoggedIn == true){
				output = true
			}
		}
	}
    
    return output
}

io.on("connection", (socket)=>{
	
	
	//media handler 
	socket.on("set-media-params", async(data)=>{
		
		let accessorId = data.accessorId
		let deviceId = data.deviceId
		let socketCheck = await checkIfSocketActive(accessorId,deviceId)
		if(socketCheck == true){
			
			let getSockets = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-sockets"})
			let sockets = getSockets.body 
			
			let socket = sockets.find((sockets)=>{
				return sockets.userId === accessorId
			})
			
			socket.ownerId = data.ownerId 
			socket.format = data.format 
			socket.id = data.id
			
			await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"user-sockets"},{$set:{"body":sockets}})
			
		}
		
	})
	
	//update objetcs 
	socket.on("register-problem-view", async(data)=>{
		try{
			let userId = data.userId 
			let deviceId = data.deviceId
			let problemId = data.problemId 
			let socketCheck = await checkIfSocketActive(userId,deviceId)
			if(socketCheck == true){
				let getProblems = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"forum-data"})
				let problems = getProblems.body 
				let problem = problems.find((problems)=>{
					return problems.id === problemId
				})
				if(problem){
					
					problem.opens = problem.opens+1 
					await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"forum-data"},{$set:{"body":problems}})
					
					
				}else{
					console.log("Problem data not found")
				}
			}
		}catch{
			console.log("An error occurred while updating problem data")
		}
	})
	
	socket.on("register-job-view", async(data)=>{
		try{
			let userId = data.userId 
			let jobId = data.jobId 
			let deviceId = data.deviceId
			let socketCheck = await checkIfSocketActive(userId,deviceId)
			if(socketCheck == true){
				let getjobs = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"job-lisitngs"})
				let jobs = getJobs.body 
				let job = jobs.find((jobs)=>{
					return jobs.id === jobId
				})
				if(job){
					
					job.opens = job.opens+1 
					await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"job-listings"},{$set:{"body":problems}})
					
					
				}else{
					console.log("Job data not found")
				}
			}
		}catch{
			console.log("An error occurred while updating job data")
		}
	})
	
	//ping users  
	
	setInterval(async()=>{
		
		let activeUsers = await getActiveUsers()
		
		if(activeUsers.length > 0){
		
			for(var i=0; i<activeUsers.length; i++){
				let user = activeUsers[i]
				user.status = false
			}
			
			await updateActiveSockets(activeUsers)
			socket.emit("ping")
			
		}
		
	},1000*60)
	
	socket.on("ping-back",(data)=>{
		activateUserSocket(data.userId,deviceId)
	});
	
	
	
	
	
})

//Page server responses

function SubDateEvaluator(sub){
	
	let output = false 
	
	let subDate = sub.dateEnded
	
	if(
		subDate.year == serverTime.year &&
		subDate.month < serverTime.month
	){
		output = true
	}
	if(
		subDate.year == serverTime.year &&
		subDate.month == serverTime.month &&
		subDate.date < serverTime.date
	){
		output = true
	}
	
	return output
	
}

async function updateAdminDataController(){
	
	try{
		await timeProcessor()
		
		let getData = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"admin-data-controller"})
		let adminData = getData.body 
		let year = adminData.year 
		
		let filteredSubs = []
		
		let subscriptions = adminData.subscriptions 
		
		for(var i=0; i<subscriptions.length; i++){
			
			let sub = subscriptions[i]
			
			let evaluate = SubDateEvaluator(sub)
			
			if(evaluate == true){
				
				filteredSubs.push(sub)
				
			}
			
		}
		
		if(year != serverTime.year){
			let oldData = adminData
			oldData.historicalData = null 
			adminData.year = serverTime.year
			adminData.cashTransfers = []
			adminData.transfersPaidIn = []
			adminData.drawings = []
			adminData.subscriptions = filteredSubs 
			adminData.userLogons = []
			adminData.historicalData.push(oldData)
			
			await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"admin-data-controller"},{$set:{"body":adminData}})
		}
		
	}catch{
		console.log("Error updating admin data controller")
	}
	
}


async function checkConnection(url){
	let output = false 
	
	dns.lookup(url,(error)=>{
		if(error && error.code === "ENOTFOUND"){
			console.log("url not responsive")
		}else{
			output = true
		}
	})
	
	return output 
}

let onboardRates = null

async function getRates(){
	var output = null
	
	if(checkConnection("https://www.floatrates.com/daily/usd.json") == true){
		
		let get = await fetch("https://www.floatrates.com/daily/usd.json")
		
		let response = await get.json()
		
		await mongoClient.db("CriterionDev").collection("Main").updateOne({"name":"exchange-rates"},{$set:{"body":response}})
		
		output = response
		
		onboardRates = output
		
	}else{
		
		let get = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"exchange-rates"})
		
		let response = get.body
		
		output = response
		
		onboardRates = output
		
	}
	
	return output
}

setInterval(async()=>{
	if(onboardRates == null){
			await getRates()
	}else{
		let search = onboardRates["syp"]
		if(!search){			
			await getRates()
		}
	}
},5000)


function findValue(code){
	var output = null
	try{
		
		let search = onboardRates[code.toLowerCase()]
		if(search){
			output = search.rate
		}
		
	}catch{
		output = null
	}
	
	
	return output
}

let processMap = async(array,map)=>{
	let output = null
	try{
		let search = onboardRates["syp"]
		if(search){			
			let rates = onboardRates
			for(var i=0; i<array.length; i++){
				let code = array[i]
				let search = findValue(code)
				if(search){
					map[code] = search
				}else{
					map[code] = 0.0
				}
			}
			output = map
		}else{
			setTimeout(()=>{processMap(array,map)},10000)
		}
	}catch{
		output = null
	}
	
	return output
	
}

app.get("/get-leap-year",async(request,response)=>{
	try{
		let getData = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"leap-year-status"})
		response.send(json({"status":getData.status}))
	}catch{
		response.send(json({"status":"server-error"}))
	}
})

app.post("/check-time", async(request,response)=>{
	let data = request.body
	
	await timeProcessor()
	
	console.log(serverTime,date)
	
	let check = checkTime(data)
	
	if( check == true){
		response.send(JSON.stringify({"status":true}))
	}else{
	    response.send(JSON.stringify({"status":false}))
	}
})

app.post("/get-conversion",async(request,response)=>{
	try{
		
		let data = request.body
		
		let map = data.map 
		
		let array = data.array
		
		let process = await processMap(array,map)
		
		if(process != null){
			response.send(JSON.stringify({"status": "success","data":process}))
		}else{
			response.send(JSON.stringify({"status": "server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.get("/process-payment",async(request,response)=>{
    try{
        response.sendFile(__dirname+"/paymentsection.html") 
    }catch{
        response.send(JSON.stringify({"status":"server-error"}))
    }
})
app.get("/",async(request,response)=>{
    try{
        response.sendFile(__dirname+"/CollectionConsole.html") 
    }catch{
        response.send(JSON.stringify({"status":"server-error"}))
    }
})

/////////////////////////////////////////////////////////////*Post Data Helpers*///////////////////////////////////////////////////////////////////////////////////////

function createUserDirectories(user){
    var output = false
    var userId = user.userId
    fs.mkdir(__dirname+`/User Data/${userId}`, (error)=>{
        if(!error) {
            fs.mkdir(__dirname+`/User Data/${userId}/Images`, (error)=>{
                if(!error){
                    fs.mkdir(__dirname+`/User Data/${userId}/Videos`, (error)=>{
                        if(!error){
                            fs.mkdir(__dirname+`/User Data/${userId}/Audio`, (error)=>{
                                if(!error){
                                    fs.mkdir(__dirname+`/User Data/${userId}/HLSPlaylists`, (error)=>{
                                        if(!error){
                                            fs.mkdir(__dirname+`/User Data/${userId}/Data`, (error)=>{
                                                if(!error){
                                                    fs.mkdir(__dirname+`/User Data/${userId}/Businesses`, (error)=>{
                                                        output = true
                                                    })
                                                }else{
                                                    console.log(error)
                                                }
												
                                            })
                                            
                                        }else{
                                            console.log(error)
                                        }
                                    })
                                }else{
                                    console.log(error)
                                }
                            })
                        }else{
                            console.log(error)
                        }
                    })
                }else{
                    console.log(error)
                }
            })
        }
    })
    
    
    if(output == true){
        //Create video directories 
        fs.mkdir(path.join(__dirname+`/User Data/${userId}/144videos`, (error)=>{
            if(error){
                console.log(error)
            }else{
                fs.mkdir(path.join(__dirname+`/User Data/${userId}/240videos`, (error)=>{
                    if(error){
                        console.log(error)
                    }else{
                        fs.mkdir(path.join(__dirname+`/User Data/${userId}/360videos`, (error)=>{
                            if(error){
                                console.log(error)
                            }else{
                                fs.mkdir(path.join(__dirname+`/User Data/${userId}/480videos`, (error)=>{
                                    if(error){
                                        console.log(error)
                                    }else{
                                        fs.mkdir(path.join(__dirname+`/User Data/${userId}/720videos`, (error)=>{
                                            if(error){
                                                console.log(error)
                                            }else{
                                                fs.mkdir(path.join(__dirname+`/User Data/${userId}/1080videos`, (error)=>{
                                                    if(error){
                                                        output = false
                                                        console.log(error)
                                                    }
                                                }))
                                            }
                                        }))
                                    }
                                }))
                            }
                        }))
                    }
                }))
            }
        }))
    }
    
    return output
}

//Orignal Code 

app.post("/login-user", async(request,response)=>{
	
	try{
		
		let data = request.body 
		let emailAddress = data.emailAddress 
		let password = data.password 
		let deviceId = data.deviceId
		
		let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
		let users = getUsers.body 
		let search = users.find((users)=>{
			
			return users.emailAddress === emailAddress
			
		})
		
		if(search){
			if(search.password === password){
				let getSockets = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-sockets"})
				let sockets = getSockets.body 
				let socket = sockets.find((sockets)=>{
					return sockets.userId === user.id
				})
				if(socket){
					socket.deviceId = deviceId 
					socket.active = true 
					socket.alreadyLoggedIn = true
					
					await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"user-sockets"},{$set:{"body":sockets}})
					if(search.accountStatus =="Active"){						
						response.send(json({"status":"success","data":search}))
					}else{
						response.send(json({"status":"unavailable"}))
					}
					
				}else{
					response.send(JSON.stringify({"status":"server-error"}))
				}
			}else{
				response.send(JSON.stringify({"status":"wrong-password"}))
			}
		}else{
			response.send(JSON.stringify({"status":"non-existent"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
	
})




app.post("/add-new-user", async(request,response)=>{
	try{
		
		let data = request.body 
		let newUser = data.userData 
		let emailCheck = await checkEmails(newUser.emailAddress)
		if(emailCheck == false){
			
			let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
			let users = getUsers.body 
			users.push(newUser)
			
			await addUserSocket(newUser.id,"user", data.deviceId)
			
			await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"user-profiles"},{$set:{"body":users}})
			let process = await  createUserDirectories(newUser.id)
			if(process == true){
				
				response.send(JSON.stringify({"status":"success","data":newUser}))
				
			}else{
				response.send(JSON.stringify({"status":"server-error"}))
			}
			
		}else{
			response.send(JSON.stringify({"status":"email-exists"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/find-secret-question",async(request,response)=>{
	try{
		
		let data = request.body 
		let emailAddress = data.emailAddress 
		let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
		let users = getUsers.body 
		let user = users.find((users)=>{
			return users.emailAddress === emailAddress
		})
		if(user){
			response.send(JSON.stringify({"status":"success","data":{"sq":user.secretQuestion}}))
		}else{
			response.send(JSON.stringify({"status":"not-found"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/change-secret-question", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let socketCheck = await checkIfSocketActive(userId)
		if(socketCheck == true){
			
			let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
			let users = getUsers.body 
			let user = users.find((users)=>{
				users.id === userId
			})
			if(user){
				
				user.secretQuestion = data.secretQuestion
				user.secretQuestionAnswer = data.secretQuestionAnswer
				await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"user-profiles"},{$set:{"body":users}})
				response.send(JSON.stringify({"status":"success"}))
				
			}else{
				
				response.send(JSON.stringify({"status":"not-found"}))
				
			}
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/get-user-by-email-address",async(request,response)=>{
	try{
		
		let data = request.body 
		let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
		let users = getUsers.body 
		let user = users.find((users)=>{
			return users.emailAddress === data.emailAddress
		})
		if(user){
			responses.send(JSON.stringify({"status":"success","data":user}))
		}else{
			response.send(JSON.stringify({"status":"not-found"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/change-email-address", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let socketCheck = await checkIfSocketActive(userId)
		if(socketCheck == true){
			
			let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
			let users = getUsers.body 
			let user = users.find((users)=>{
				return users.id === userId
			})
			if(user){
				
				user.emailAddress = data.emailAddress 
				await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"user-profiles"},{$set:{"body":users}})
				response.send(JSON.stringify({"status":"success"}))
				
			}else{
				response.send(JSON.stringify({"status":"not-found"}))
			}
		}else{
			
			response.send(JSON.stringify({"status":"server-error"}))
			
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/change-password", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let socketCheck = await checkIfSocketActive(userId)
		if(socketCheck == true){
			
			let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
			let users = getUsers.body 
			let user = users.find((users)=>{
				return users.id === userId
			})
			
			if(user){
				
				user.password = data.password 
				await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"user-profiles"},{$set:{"body":users}})
				response.send(JSON.stringify({"status":"success"}))
				
			}else{
				response.send(JSON.stringify({"status":"not-found"}))
			}
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

async function MtpCategorySorter(jobs,posts,hits){
	
	let output = []
	let collection = []
	for(var i=0; i<jobs.length;i++){
		let jx = jobs[i]
		let language = jx.language 
		let search = collection.find((collection)=>{
			return collection.category === language
		})
		if(search){
			if(hits == true){				
				search.hits = search.hits+1
			}
			if(posts == true){
				search.posts = search.posts+1
			}
		}else{
			if(hits == true){				
				collection.push({
					"category":language,
					"posts":0,
					"jobs":0,
					"hits":1
				})
			}
			if(posts == true){				
				collection.push({
					"category":language,
					"posts":1,
					"jobs":0,
					"hits":0
				})
			}
		}
	}
	
	if(posts == true){
		collection.sort((a,b)=>{
			a.posts - b.posts
		})
		for(var i=0; i<collection.length; i++){
			let cat = collection[i].category
			output.push(cat)
		}
	}
	if(hits == true){
		collection.sort((a,b)=>{
			a.hits - b.hits
		})
		for(var i=0; i<collection.length; i++){
			let cat = collection[i].category
			output.push(cat)
		}
	}
	
	return output
}

app.post("/get-categories-all", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId
		let socketCheck = await checkIfSocketActive(userId)
		if(socketCheck == true){
			
			let getJobs = await mongoClient.db("CriterionDev").findOne({"name":"job-listings"})
			let jobs = getJobs.body 
			let output = await MtpCategorySorter(jobs,false,true)
			response.send(JSON.stringify({"status":"success","data":output}))
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

async function SortProblemCategories(problems){
	
	let output = []
	let collection = []
	for(var i=0; i<problems.length; i++){
		let problem = problems[i]
		let language = problem.language 
		let search = collection.find((collection)=>{
			return collection.category === language
		})
		if(search){
			search.hits = saerch.hits+1
		}else{
			collection.push({
				"category":language,
				"hits":1
			})
		}
	}
	
	//sort out categories by hits 
	collection.sort((a,b)=>{
		a.hits - b.hits
	})
	for(var i=0; i<collection.length;i++){
		let cat = collection[i].category
		output.push(cat)
	}
	return output
}

app.post("/get-all-problem-categories", async(request,response)=>{
	try{
		let data = request.body
		let userId = data.userId 
		let socketCheck = await checkIfSocketActive(userId)
		if(socketCheck == true){
			
			let getProblems = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"problem-listings"})
			let problems = getProblems.body 
			let output = await SortProblemCategories(problems)
			response.send(JSON.stringify({"status":"success","data":output}))
			
		}else{			
			response.send(JSON.stringify({"status":"server-error"}))
		}
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

async function FilterJobsByCategory(category,jobs,oldestNewest){
	
	let output = []
	for(var i=0; i<jobs.length; i++){
		let job = jobs[i]
		let language = job.language 
		if(category === "All"){
			output.push(job)
		}else{
			if(job.language === category){
				output.push(job)
			}
		}
	}
	//sort jobs selected by number of opens 
	//let the order be in descending order to give jobs with less views chance to be seen 
	output.sort((a,b)=>{
		b.opens - a.opens
	})
	//sort for time 
	let yearsArray = []
	for(var i=0; i<output.length; i++){
		let job = output[i]
		let date = job.dateCreated 
		let year = date.year 
		let search = yearsArray.find((yearsArray)=>{
			return yearsArray.year == year
		})
		if(!search){
			yearsArray.push({
				"year":year,
				"jobs":[]
			})
		}
	}
	
	for(var i=0; i< yearsArray.length; i++){
		let year = yearsArray[i]
		for(var x=0; x<output.length; x++){
			let job = output[x]
			let date = job.dateCreated 
			if(date.year == year){
				let y = yearsArray.find((yearsArray)=>{
					return yearsArray.year
				})
				y.jobs.push(job)
			}
		}
	}
	
	//sort each year collection by month 
	for(var i=0; i<yearsArray.length; i++){
		let targetYear = yearsArray[i].jobs 
		if(oldestNewest == true){
			targetYear.sort((a,b)=>{
				a.dateCreated.month - b.dateCreated.month
			})
			yearsArray[i].jobs = targetYear
		}else{
			targetYear.sort((a,b)=>{
				b.dateCreated.month - a.dateCreated.month
			})
			yearsArray.jobs = targetYear
		}
	}
	
	//sort each month for dates 
	for(var i=0; i<yearsArray.length; i++){
		let year = yearsArray[i]
		let months = {
			"jan":[],
			"feb":[],
			"march":[],
			"apr":[],
			"may":[],
			"june":[],
			"july":[],
			"aug":[],
			"sept":[],
			"oct":[],
			"nov":[],
			"dec":[]
		}
		
		let jobs = year.jobs 
		for(var x=0; x<jobs.length; x++){
			let job = jobs[x]
			if(job.dateCreated.month == 0){
				months["jan"].push(job)
			}
			if(job.dateCreated.month == 1){
				months["feb"].push(job)
			}
			if(job.dateCreated.month == 2){
				months["march"].push(job)
			}
			if(job.dateCreated.month == 3){
				months["apr"].push(job)
			}
			if(job.dateCreated.month == 4){
				months["may"].push(job)
			}
			if(job.dateCreated.month == 5){
				months["june"].push(job)
			}
			if(job.dateCreated.month == 6){
				months["july"].push(job)
			}
			if(job.dateCreated.month == 7){
				months["aug"].push(job)
			}
			if(job.dateCreated.month == 8){
				months["sept"].push(job)
			}
			if(job.dateCreated.month == 9){
				months["oct"].push(job)
			}
			if(job.dateCreated.month == 10){
				months["nov"].push(job)
			}
			if(job.dateCreated.month == 11){
				months["dec"].push(job)
			}
		}
		
		let monthKeys = months.keys
		
		
		for(var x=0; x<monthKeys.length;x++){
			let key = monthKeys[x]
			months[key].sort((a,b)=>{
				a.dateCreated.date - b.dateCreated.date
			})
		}
		
		let finalArray = []
		
		for(var x=0; x<monthKeys.length; x++){
			let key = monthKeys[x]
			let jobsx = months[key]
			for(var y=0; y<jobs.length; y++){
				let job = jobsx[y]
				finalArray.push(job)
			}
		}
		yearsArray[i].jobs = finalArray
		
	}
	
	//reorganise years array back into one single array 
	let finalOutput = []
	for(var i=0; i < yearsArray.length; i++){
		let jobs = yearsArray[i].jobs 
		for(var x=0; x<yearsArray.length; x++){
			let job = jobs[x]
			finalOutput.push(job)
		}
	}
	
	return finalOutput
	
}

async function ProcessJobsByLocation(jobs,location){
	let output = []
	
	if(location.city){		
		for(var i=0; i<jobs.length; i++){
			let job = jobs[i]
			let locale = job.location
			if(locale.city.toLowerCase() === location.city.toLowerCase()){
				let search = output.find((output)=>{
					return output.id === job.id
				})
				if(!search){
					output.push(job)
				}
			}
		}
	}
	if(location.country){
		for(var i=0; i<jobs.length; i++){
			let job = jobs[i]
			let locale = job.location 
			if(locale.country.toLowerCase() === location.country.toLowerCase()){
				let search = output.find((output)=>{
					return output.id === job.id
				})
				if(!search){
					output.push(job)
				}
			}
		}
	}
	if(location.districtRegionProvince){
		for(var i=0; i<jobs.length; i++){
			let job = jobs[i]
			let locale = job.location 
			if(locale.districtRegionProvince.toLowerCase() === location.districtRegionProvince.toLowerCase()){
				let search = output.find((output)=>{
					return output.id === job.id
				})
				if(!search){
					output.push(job)
				}
			}
		}
	}
	
	//Sort output for years 
	let yearsCollection = []
	
	for(var i=0; i<output.length; i++){
		let job = output[i]
		let year = job.dateCreated.year 
		let search = yearsCollection.find((yearsCollection)=>{
			return yearsCollection.year == year
		})
		if(!search){
			yearsCollection.push(
				{
					"year": year,
					"jobs":[job]
				}
			)
		}else{
			search.jobs.push(job)
		}
	}
	
	//sort years collection for months 
	for(var i=0; i<yearsCollection.length; i++){
		
		let array = yearsCollection[i].jobs 
		array.sort((a,b)=>{
			a.dateCreated.month - b.dateCreated.month
		})
		yearsCollection[i].jobs = array
		
	}
	
	let finalArray = []
	
	//sort for dates
	for(var i=0; i<yearsCollection.length; i++){
		let x = yearsCollection[i]
		let monthsCollection = {
			"jan":[],
			"feb":[],
			"march":[],
			"apr":[],
			"may":[],
			"june":[],
			"july":[],
			"aug":[],
			"sept":[],
			"oct":[],
			"nov":[],
			"dec":[]
		}
		let array = x.jobs 
		for(var y = 0; y<array.length; y++){
			let job = array[y]
			if(job.dateCreated.month == 0){
				monthsCollection["jan"].push(job)
			}
			if(job.dateCreated.month == 1){
				monthsCollection["feb"].push(job)
			}
			if(job.dateCreated.month == 2){
				monthsCollection["march"].push(job)
			}
			if(job.dateCreated.month == 3){
				monthsCollection["apr"].push(job)
			}
			if(job.dateCreated.month == 4){
				monthsCollection["may"].push(job)
			}
			if(job.dateCreated.month == 5){
				monthsCollection["june"].push(job)
			}
			if(job.dateCreated.month == 6){
				monthsCollection["july"].push(job)
			}
			if(job.dateCreated.month == 7){
				monthsCollection["aug"].push(job)
			}
			if(job.dateCreated.month == 8){
				monthsCollection["sept"].push(job)
			}
			if(job.dateCreated.month == 9){
				monthsCollection["oct"].push(job)
			}
			if(job.dateCreated.month == 10){
				monthsCollection["nov"].push(job)
			}
			if(job.dateCreated.month == 11){
				monthsCollection["dec"].push(job)
			}
		}
		
		let monthKeys = monthsCollection.keys 
		for(var y=0; y<monthKeys.length; y++){
			let key = monthKeys[y]
			monthCollection[key].sort((a,b)=>{
				a.dateCreated.date - b.dateCreated.date
			})
			let array = monthCollection[key]
			for(var t=0; t<array.length; t++){
				finalOutput.push(array[t])
			}
		}
		
	}
	
	return finalOutput
}

app.post("/get-jobs-by-category", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let socketCheck = await checkIfSocketActive(userId)
		let locationData = data.location
		if(socketCheck == true){
			
			let getJobs = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"job-listings"})
			let jobs = getJobs.body
			let processForLocation = await ProcessJobsByLocation(jobs,location)
			let selectedCategory = data.selectedCategory 
			let output = await FilterJobsByCategory(jobs,selectedCategory,data.oldestNewest)
			response.send(JSON.stringify({"status":"success","data":output}))
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

async function processForCategory(problems, category){
	let output = []
	
	for(var i=0; i<problems.length; i++){
		if(problems[i].category === category){
			output.push(problems[i])
		}
	}
	
	return output
}

app.post("/get-problems-by-category", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let deviceId = data.deviceId 
		let socketCheck = await checkIfSocketActive(userId,deviceId)
		let locationData = data.location
		if(socketCheck == true){
			
			let getProblems = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"forum-data"})
			let problmes = getProblems.body
			let processForCategory = await ProcessProblemsByCategory(problems,data.selectedCategory)
			response.send(JSON.stringify({"status":"success","data":processForCategory}))
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

async function FilterJobsBySearch(jobs,input){
	let output = []
	
	for(var i=0 ; i<jobs.length; i++){
		let job = jobs[i]
		let id = job.id 
		let ownerId = job.ownerId 
		let mainDescription = job.mainDescription 
		let language = job.language 
		if(id.toRegex().test(input) == true){
			let search = output.find((output)=>{
				return output.id === job.id
			})
			if(!search){
				output.push(job)
			}
		}
		if(ownerId.toRegex().test(input) == true){
			let search = output.find((output)=>{
				return output.id === job.id
			})
			if(!search){
				output.push(job)
			}
		}
		if(mainDescription.toRegex().test(input) == true){
			let search = output.find((output)=>{
				return output.id === job.id
			})
			if(!search){
				output.push(job)
			}
		}
		if(language.toRegex().test(input) == true){
			let search = output.find((output)=>{
				return output.id === job.id
			})
			if(!search){
				output.push(job)
			}
		}
	}
	
	return output
}

app.post("/search-jobs-by-identifier", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let socketCheck = await checkIfSocketActive(userId)
		if(socketCheck == true){
			let getJobs = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"job-listings"})
			let jobs = getJobs.body 
			let searchInput = data.searchInput 
			let searchJobs = await FilterJobsBySearch(jobs,searchInput)
			response.send(JSON.stringify({"status":"success","data":searchJobs}))
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})


app.post("/add-new-job-listing", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId
		let deviceId = data.deviceId
		let socketCheck = await checkIfSocketActive(userId,deviceId)
		if(socketCheck == true){
			
			let getJobs = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"job-listings"})
			let jobs = getJobs.body 
			jobs.push(data.newJob)
			await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"job-listings"},{$set:{"body":jobs}})
			response.send(JSON.stringify({"status":"success"}))			
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/check-subscription-status", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let deviceId = data.deviceId
		let socketCheck = await checkIfSocketActive(userId,deviceId)
		if(socketCheck == true){
			
			let getData = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"admin-data-controller"})
			let adminData = getData.body
			let subs = adminData.subscriptions
			
			let findSub = subs.find((subs)=>{
				return subs.userId === userId
			})
			if(findSub){
				
				let process = checkSubDate(findSub)
				response.send(JSON.stringify({"status":"success","output":process}))
				
			}else{
				response.send(JSON.stringify({"status":"success","output":false}))
			}
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

async function generateSubID(){
	let output;
	let array = [0,1,2,3,4,5,6,7,8,9]
	let selected = []
	for(var i=0 ; i<array.length; i++){
		let shuffledNums = array.shuffle()
		let x = shuffledNums[2]
		selected.push(x)
	}
	output = "CDS-"
	for(var i=0; i<selected.length; i++){
		output = output+`${selected[i]}`
	}
	return output
}

app.post("/generate-new-subscription", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let socketCheck = await checkIfSocketActive(userId)
		if(socketCheck == true){
			
			let getAdminData = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"admin-data-controller"})
			let adminData = getAdminData.body
			let subs = adminData.subscriptions 
			let newSub = {
				"dateStarted":serverTime,
				"id":generateSubID(),
				"dateEnding":{
					"date":serverTime.date,
					"month":serverTime.month,
					"year":serverTime.year+1,
					"hours":serverTime.hours,
					"mins":serverTime.mins
				},
				"value":5.0,
				"currency":"USD",
				"ownerId":userId
			}
			subs.push(newSub)
			await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"admin-data-controller"},{$set:{"body":adminData}})
			
			let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
			let users = getUsers.body 
			let user = users.find((users)=>{
				users.id === userId 
			})
			user.subscribed = true 
			await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"user-profiles"},{$set:{"body":users}})
			
			response.send(JSON.stringify({"status":"success"}))
			
		}else{			
			response.send(JSON.stringify({"status":"server-error "}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error "}))
	}
})

async function getJobLocations(jobs,mode){
	let output = []
	if(mode == 0){
		//City
		for(var i=0; i<jobs.length;i++){
			let job = jobs[i]
			let city = job.location.city 
			if(output.includes(city) == false){
				output.push(city)
			}
		}
	}
	if(mode == 1){
		//Country
		for(var i=0; i<jobs.length;i++){
			let job = jobs[i]
			let country = job.location.country 
			if(output.includes(country) == false){
				output.push(country)
			}
		}
	}
	if(mode == 2){
		//Region
		for(var i=0; i<jobs.length;i++){
			let job = jobs[i]
			let region = job.location.districtRegionProvince
			if(output.includes(region) == false){
				output.push(region)
			}
		}
	}
	return output
}

app.post("/get-job-locations", async()=>{
	try{
		let data = request.body
		let mode = data.mode 
		let deviceId = data.deviceId 
		let userId = data.userId 
		
		let socketCheck = await checkIfSocketActive(userId,deviceId)
		
		if(socketCheck == true){
			let getJobs = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"job-listings"})
			let jobs = getJobs.body 
			let process = await getJobLocations(jobs,mode)
			
			response.send(JSON.stringify({"status":"success","data":process}))
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/update-job-object", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let socketCheck = await checkIfSocketActive(userId)
		
		if(socketCheck == true){
			let getJobs = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"job-listings"})
			let jobs = getJobs.body 
			let job = jobs.find((jobs)=>{
				return jobs.id === data.jobId
			})
			if(job){
				
				let index = jobs.findIndex((jobs)=>{
					return jobs.id === data.jobId
				})
				
				jobs.splice(index,1,data.job)
				await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"job-listings"},{$set:{"body":jobs}})
				response.send(JSON.stringify({"status":"success"}))
				
			}else{
				response.send(JSON.stringify({"status":"server-error"}))
			}
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/update-forum-object", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let socketCheck = await checkIfSocketActive(userId)
		
		if(socketCheck == true){
			let getForumData = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"forum-data"})
			let problems = getForumData.body 
			let problem = problems.find((problems)=>{
				return problems.id === data.problemId
			})
			if(problem){
				
				let index = problems.findIndex((problems)=>{
					return problems.id === data.problemId
				})
				
				problems.splice(index,1,data.problem)
				await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"forum-data"},{$set:{"body":problems}})
				response.send(JSON.stringify({"status":"success"}))
				
			}else{
				response.send(JSON.stringify({"status":"server-error"}))
			}
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/add-new-problem", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let socketCheck = await checkIfSocketActive(userId)
		
		if(socketCheck == true){
			let getForumData = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"forum-data"})
			let problems = getForumData.body 
			let problem = problems.find((problems)=>{
				return problems.id === data.problemId
			})
			if(!problem){
				
				problems.push(data.problem)
				await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"forum-data"},{$set:{"body":problems}})
				response.send(JSON.stringify({"status":"success"}))
				
			}else{
				response.send(JSON.stringify({"status":"already-exists"}))
			}
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/get-fresh-job-data",async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let socketCheck = await checkIfSocketActive(userId)
		if(socketCheck == true){
			
			let getJobs = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"job-listings"})
			let jobs = getJobs.body
			let job = jobs.find((jobs)=>{
				return jobs.id === data.jobId
			})
			if(job){
				response.send(JSON.stringify({"status":"success","data":job}))
			}else{
				response.send(JSON.stringify({"status":"not-found"}))
			}
			
		}else{			
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/get-fresh-problem-data",async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let socketCheck = await checkIfSocketActive(userId)
		if(socketCheck == true){
			
			let getForumData = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"forum-data"})
			let problems = getForumData.body 
			let problem = problems.find((problems)=>{
				return problems.id === data.problemId
			})
			if(problem){				
				response.send(JSON.stringify({"status":"success","data":problem}))
			}else{
				response.send(JSON.stringify({"status":"not-found"}))
			}
			
		}else{			
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})


app.post("/post-problem-response", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let deviceId = data.deviceId
		let socketCheck = await checkIfSocketActive(userId,deviceId)
		if(socketCheck == true){
			
			let getForumData = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"forum-data"})
			let problems = getForumData.body 
			let problem = problems.find((problems)=>{
				return problems.id === data.problemId
			})
			if(problem){
				
				let x = problem.corresponders
				
				let search = x.find((x)=>{
					return x.id === data.responseData.id
				}) 
				if(!search){					
					problem.corresponders.push(data.responseData)
					await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"forum-data"},{$se:{"body":problems}})
					response.send(JSON.stringify({"status":"success"}))
				}else{
					response.send(JSON.stringify({"status":"already-exists"}))
				}
			}else{
				response.send(JSON.stringify({"status":"not-found"}))
			}
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/post-response-vote", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let socketCheck = await checkIfSocketActive(userId)
		if(socketCheck == true){
			
			let getForumData = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"forum-data"})
			let problems = getForumData.body 
			let problem = problems.find((problems)=>{
				return problems.id === data.problemId
			})
			if(problem){
				let responses = problem.corresponders 
				let search = responses.find((responses)=>{
					return responses.id === data.responseId
				})
				if(search){
					
					if(search.votes.includes(userId) == false){						
					
						search.votes.push(userId)
						await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"forum-data"},{$se:{"body":problems}})
						response.send(JSON.stringify({"status":"success","data":{"votes":search.votes.length,"type":"vote"}}))
					
					}else{
						
						let index = search.votes.indexOf(userId)
						search.votes.splice(index,1)
						await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"forum-data"},{$se:{"body":problems}})
						response.send(JSON.stringify({"status":"success","data":{"votes":search.votes.length,"type":"unvote"}}))
						
					}
					
				}else{
					response.send(JSON.stringify({"status":"response-not-found"}))
				}
			}else{
				response.send(JSON.stringify({"status":"problem-not-found"}))
			}
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

async function ProcessForumProblems(userId,problems,category){
	let output = [] 
	try{
		let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
		let users = getUsers.body 
		let user = users.find((users)=>{
			return userId === userId 
		})
		
		if(category === "All"){
			
			if(user){
				let languages = []
				let jobsViewed = user.jobsViewed
				let problemsViewed = user.problemsViewed
				
				if(jobsViewed.length > 0 || problemsViewed.length > 0){				
					for(var i=0; i<jobesViewed.length; i++){
						let job = jobsViewed[i]
						let x = job.language
						let search = languages.find((languages)=>{
							return languages.name === x
						})
						if(search){
							search.hits = (search.hits + 1)
						}else{
							languages.push({
								"name":x,
								"hits":1
							})
						}
					}
					for(var i=0; problemsViewed.length; i++){
						let problem = problemsViewed[i]
						let x = language 
						let search = languages.find((languages)=>{
							return languages.name === x
						})
						if(search){
							search.hits = (search.hits+1)
						}else{
							languages.push({
								"name":language,
								"hits":1
							})
						}
					}
					languages.sort((a,b)=>{
						a.hits - b.hits
					})
					let total = 0 
					for(var i=0; i < languages.length; i++){
						let lang = languages[i]
						let hits = lang.hits 
						total = total+hits 
					}
					for(var i=0; i<languages.length; i++){
						let lang = languages[i]
						let hits = lang.hits 
						total = total+hits
					}
					for(var i=0; i< languages.length; i++){
						let lang = languages[i]
						let percentage = Math.round((lang.hits/total)*100)
						let proportion = Math.round((percentage/100)*10)
						languages[i].proportion = proportion
					}
					let sortedProblems = await SortProblemsForViews(problems)
					let totalSortedProblems = TotalSortedProblems(sortedProblems)
					let track = 0
					for(var xy=0; xy<totalSortedProblems.length;xy++){
						let i = 0 
						do{
							let lang = language[i]
							let ptrack = 0
							let p = lang.proportion
							let problemsCat = sortedProblems.find((sortedProblems)=>{
								return sortedProblems.category === lang.name
							})
							let sa = []
							let problems = problemsCat.problems 
							for(var u=0; u<problems.length;u++){
								let problem = problems[u]
								let check = output.find((output)=>{
									return output.id === problemId
								})
								if(ptrack != proportion){
									if(!check){
										sa.push(problem)
										ptrack = 0
										for(var x=0; i<sa.length; sa++){
											output.push(sa[x])
										}
										break		
									}
								}
							}
							i = i+1
							if(i == (languages.length-1)){
								break
							}
						}while(i<languages.length)
					}
				}
				else{
					for(var i=0; i<problems.length; i++){
						let problem = problems[i]
						let x = problem.language
						let search = languages.find((languages)=>{
							return languages.name === x
						})
						if(search){
							search.hits = (search.hits + 1)
						}else{
							languages.push({
								"name":x,
								"hits":1
							})
						}
					}
					
					languages.sort((a,b)=>{
						a.hits - b.hits
					})
					let total = 0 
					for(var i=0; i < languages.length; i++){
						let lang = languages[i]
						let hits = lang.hits 
						total = total+hits 
					}
					for(var i=0; i<languages.length; i++){
						let lang = languages[i]
						let hits = lang.hits 
						total = total+hits
					}
					for(var i=0; i< languages.length; i++){
						let lang = languages[i]
						let percentage = Math.round((lang.hits/total)*100)
						let proportion = Math.round((percentage/100)*10)
						languages[i].proportion = proportion
					}
					let sortedProblems = await SortProblemsForViews(problems)
					let totalSortedProblems = TotalSortedProblems(sortedProblems)
					let track = 0
					for(var xy=0; xy<totalSortedProblems.length;xy++){
						let i = 0 
						do{
							let lang = language[i]
							let ptrack = 0
							let p = lang.proportion
							let problemsCat = sortedProblems.find((sortedProblems)=>{
								return sortedProblems.category === lang.name
							})
							let sa = []
							let problems = problemsCat.problems 
							for(var f=0; f<problems.length;f++){
								let problem = problems[f]
								let check = output.find((output)=>{
									return output.id === problemId
								})
								if(ptrack != proportion){
									if(!check){
										sa.push(problem)
										ptrack = 0
										for(var x=0; x<sa.length; x++){
											output.push(sa[x])
										}
										break		
									}
								}
							}
							i = i+1
							if(i == (languages.length-1)){
								break
							}
						}while(i<languages.length)
					}	
				}
			
			}
		}else{
			for(var i=0; i<problems.length; i++){
				let problem = problems[i]
				let lang = problem.lang 
				if(lang != category){
					problems.splice(i,1)
				}
			}
			
			let sortedProblems = await SortProblemsForViews(problems)
			let totalSortedProblems = TotalSortedProblems(sortedProblems)
			let track = 0
			for(var xy=0; xy<totalSortedProblems.length;xy++){
				let i = 0 
				do{
					let lang = language[i]
					let ptrack = 0
					let p = lang.proportion
					let problemsCat = sortedProblems.find((sortedProblems)=>{
						return sortedProblems.category === lang.name
					})
					let sa = []
					let problems = problemsCat.problems 
					for(var f=0; f<problems.length;f++){
						let problem = problems[f]
						let check = output.find((output)=>{
							return output.id === problemId
						})
						if(ptrack != proportion){
							if(!check){
								sa.push(problem)
								ptrack = 0
								for(var x=0; x<sa.length; x++){
									output.push(sa[x])
								}
								break		
							}
						}
					}
					i = i+1
					if(i == (languages.length-1)){
						break
					}
				}while(i<languages.length)
			}
		}
		
	}catch{
		console.log("Problem generating problem array")
	}
}

async function SortProblemsForViews(problems){
	let output = []
	for(var i=0; i<problems.length; i++){
		let lang = problems[i].language
		let search = output.find((output)=>{
			return output.category === lang
		})
		if(!search){
			output.push({
				"category":lang,
				"problems":[problems[i]]
			})
		}else{
			output.problems.push(problems[i])
		}
	}
	for(var i=0 ; i<output.length; i++){
		let x = output[i]
		let array = x.problems 
		array.sort((a,b)=>{
			a.opens - b.opens 
		})
		output[i].problems = array
	}
	return output 
}

async function TotalSortedProblems(array){
	let output = 0
	for(var i=0; i<array.length; i++){
		let x = array[i]
		let y = x.problems.length 
		output = output+y
	}
	return output
}

app.post("/get-problems-by-cateogry", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let socketCheck = await checkIfSocketActive(userId)
		if(socketCheck == true){
			
			let getForumData = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"forum-data"})
			let problems = getForumData.body 
			let processedOutput = await ProcessForumProblems(userId,problems,data.category)
			response.send(JSON.stringify({"status":"success","data":processedOutput}))
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/resolve-forum-problem", async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let socketCheck = await checkIfSocketActive(userId)
		if(socketCheck == true){
			
			let getForumData = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"forum-data"})
			let problems = getForumData.body 
			let problem = problems.find((problems)=>{
				return problems.id === data.problemId
			})
			if(problem){
				problem.resolved = true
				let responses = problem.corresponders 
				let search = responses.find((responses)=>{
					return responses.id === data.responseId
				})
				if(search){
					
					search.winner = true
					await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"forum-data"},{$set:{"body":problems}})
					response.send(JSON.stringify({"status":"success"}))
					
				}else{
					response.send(JSON.stringify({"status":"response-not-found"}))
				}
			}else{
				response.send(JSON.stringify({"status":"problem-not-found"}))
			}
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post("/get-forum problems-by-category",async(request,response)=>{
	try{
		
		let data = request.body 
		let userId = data.userId 
		let category = data.category 
		let socketCheck = await checkIfSocketActive(userId)
		if(socketCheck == true){
			
			let getProblems = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"forum-data"})
			let problems = getProblems.body
			let getData = await ProcessForumProblems(userId,problems,category)
			
			response.send(JSON.stringify({"status":"success","data":problems}))	
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))			
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.get("/get-user-image/:id", async(request,response)=>{
    try{
        let userId = request.params.id
		let check = await checkIfSocketActive(userId)
        if(check == true){
            let socket = await getUserSocket(userId)
            let mediaId = socket.mediaId
            let mediaFormat = socket.mediaFormat
            let ownerId = socket.ownerId
            let stream = fs.createReadStream(__dirname+`/User Data/${ownerId}/Images/${mediaId}${mediaFormat}`)
            stream.pipe(response)
        }else{
            response.sendStatus(404)
        }
    }catch{
        response.send(JSON.stringify({"status" : "server-error"}))
    }
}) 

app.get("/get-user-data/:id", async(request,response)=>{
    try{
        let userId = request.params.id
        let checkSocket = await checkIfSocketActive(userId) 
        if( checkSocket == true){
            let socket = await getUserSocket(userId)
            let mediaId = socket.mediaId
            let mediaFormat = socket.mediaFormat
            let ownerId = socket.ownerId
            let stream = fs.createReadStream(__dirname+`/User Data/${ownerId}/Data/${mediaId}.${mediaFormat}`)
            stream.pipe(response)
        }else{
            response.sendStatus(404)
        }
    }catch{
        response.send(JSON.stringify({"status" : "server-error"}))
    }
}) 

app.get("/delete-user-image/:id", async(request,response)=>{
    try{
        let userId = request.params.id
        if(await checkIfSocketActive(userId) == true){
            let socket = await getUserSocket(userId)
            let mediaId = socket.mediaId
            let mediaFormat = socket.mediaFormat
            let ownerId = socket.ownerId
            fs.deleteFileSync(__dirname+`/User Data/${ownerId}/Images/${mediaId}.${mediaFormat}`)
            response.send(JSON.stringify({"status": true}))
        }else{
            response.sendStatus(404)
        }
    }catch{
        response.send(JSON.stringify({"status" : "server-error"}))
    }
}) 

app.get("/delete-user-data/:id", async(request,response)=>{
    try{
        let userId = request.params.id
        let checkSocket = await checkIfSocketActive(userId) 
        if( checkSocket == true){
            let socket = await getUserSocket(userId)
            let mediaId = socket.mediaId
            let mediaFormat = socket.mediaFormat
            let ownerId = socket.ownerId
            fs.deleteFileSync(__dirname+`/User Data/${ownerId}/Data/${mediaId}.${mediaFormat}`)
            response.send(JSON.stringify({"status": true}))
        }else{
            response.sendStatus(404)
        }
    }catch{
        response.send(JSON.stringify({"status" : "server-error"}))
    }
}) 

app.post("/update-user-information", async(request,response)=>{
	
	try{
		
		let data = request.body 
		let userId = data.userId
		let socketCheck = await checkIfSocketActive(userId)
		if(socketCheck == true){
			
			let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
			let users = getUsers.body 
			let index = users.findIndex((users)=>{
				users.id === userId
			})
			users.splice(index,1,data.userData)
			await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"user-profiles"},{$set:{"body":users}})
			
			response.send(JSON.stringify({"status":"success"}))
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
		
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
	
})

app.post("/get-fresh-user-data", async(request,response)=>{
	
	try{
		
		let data = request.body 
		let userId = data.userId
		let socketCheck = await checkIfSocketActive(userId)
		if(socketCheck == true){
			
			let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
			let users = getUsers.body 
			let user = users.find((users)=>{
				users.id === userId
			})
			
			response.send(JSON.stringify({"status":"success","accountStatus":user.accountStatus}))
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
		
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
	
})

	
	
app.get("/get-server-time",(request,response)=>{
	response.send(JSON.stringify(serverTime))
})

/////////////////////////////////////////////////>>Paypal Functions<<///////////////////////////////////////////////////
async function createPaypalOrder(controller,email,time) {

	const accessToken = await generateAccessToken();
	
	console.log(accessToken)
	
	let response =  await fetch ("https://api-m.paypal.com/v2/checkout/orders", {
	
		method: "POST",
	
		headers: {
	
		"Content-Type": "application/json",
	
		"Authorization": `Bearer ${accessToken}`,
	
		},
	
		body: JSON.stringify({
	
		"purchase_units": [
	
			{
	
			"amount": {
	
				"currency_code": "USD",
	
				"value": `${controller.currentValue}.00`
	
			},
			
			"reference_id": `${generateOrderReferenceCode(controller,email)}`
	
			}
	
		],
	
		"intent": "CAPTURE"
		})
	
	});
	
	return response.json()

}



app.post('/create-paypal-order', async(request,response)=>{
	
	try{
		
		let incoming = request.body;
		
		let controller = incoming.controller;
		
		let time = incoming.time
		
		console.log(controller)
		
		let email = incoming.email;
	
		let userId = incoming.userId
		
		let createOrder = await createPaypalOrder(controller,email,time);
		
		console.log(createOrder)
							
		if(createOrder){
			response.send(JSON.stringify(createOrder))
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
	
})

const captureOrder = async (orderID) =>{

	const accessToken = await generateAccessToken();
	const base = "https://api-m.paypal.com";
	
	const url = `${base}/v2/checkout/orders/${orderID}/capture`;
	
	
	const response = await fetch(url,{
	
		method: "POST",
	
		headers:
	
		{
	
		"Content-Type": "application/json",
	
		Authorization: `Bearer ${accessToken}`,
	
		// Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
	
		// https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
	
		// "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
	
		// "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
	
		// "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
	
		},
	
	});
	
	
	return await response.json();

};


async function handleResponse(response){

	try{
	
		const jsonResponse = await response.json();
	
		return {
	
		jsonResponse,
	
		httpStatusCode: response.status,
	
		};
	
	}catch (err){
	
		const errorMessage = await response.text();
	
		throw new Error(errorMessage);
	
	}

}

app.post("/api/orders/capture", async(request,response)=>{
	
	try{
		
		const orderID  = request.body.orderID;
		
		console.log(orderID)
		
		const process = await captureOrder(orderID);
		
		console.log(process)
		
		response.send(JSON.stringify({"status":process.status}));
		
	}catch (error){
		
		console.error("Failed to create order:", error);
		
		response.status(500).json(
		
		{
		
		error: "Failed to capture order."
		
		});
		
	}
	
	
})

//Admin Processes 

app.post("/login-admin", async(request,response)=>{
	try{
		
		let data = request.body 
		let email = data.emailAddress 
		let password = data.password 
		let getAdmins = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"admin-profiles"})
		let admins = getAdmins.body 
		let search = admins.find((admins)=>{
			return admins.emailAddress === email
		})
		if(search){
			
			let passwordx = search.password 
			if(passwordx === password){
				if(search.suspended == false){	
					let socket = await getUserSocket(search.id)
					socket.deviceId = data.deviceId 
					socket.active = true 
					socket.alreadyLoggedIn = true 
					await updateUserSocket(socket)
					response.send(JSON.stringify({"status":"success","data":search}))
				}else{
					response.send(JSON.stringify({"status":"unavailable"}))
				}
			}
			
		}else{
			response.send(JSON.stringify({"status":"non-existent"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/add-new-admin",async(request,response)=>{
	try{
		
		let data = request.body 
		let adminId = data.adminId
		let deviceId = data.deviceId		
		let socketCheck = await checkIfSocketActive(adminId,deviceId)
		if(socketCheck == true){
			
			let getAdmins = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"admin-profiles"})
			let admins = getAdmins.body 
			
			let searchAdmins = admins.find((admins)=>{
				return admins.emailAddress === data.newAdmin.emailAddress
			})
			
			if(!searchAdmins){				
				admins.push(data.newAdmin)
				await addUserSocket(adminId,"admin",null)
				let process = createUserDirectories(adminId)
				if(process == true){
					await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"admin-profiles"},{$set:{"body":admins}})
					response.send(JSON.stringify({"status":"success"}))
					
				}else{
					response.send(JSON.stringify({"status":"server-error"}))
				}
			}else{
				response.send(JSON.stringify({"status":"email-exists"}))
			}
			
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/update-admin-data", async(request,response)=>{
	try{
		
		let data = request.body 
		let adminId = data.adminId 
		let deviceId = data.deviceId
		let socketCheck = await checkIfSocketActive(adminId,deviceId)
		if(socketCheck == true){
			
			let getAdmins = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"admin-profiles"})
			let admins = getAdmins.body 
			let index = admins.findIndex((admins)=>{
				admins.id === adminId
			})
			if(index){				
				admins.splice(index,1,data.adminData)
				await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"admin-profiles"},{$set:{"body":admins}})
			}else{
				response.send(JSON.stringify({"status":"server-error"}))
			}
				
			response.send(JSON.stringify({"status":"success"}))
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})


app.post("/get-fresh-admin-data", async(request,response)=>{
	try{
		
		let data = request.body 
		let adminId = data.adminId
		let deviceId = data.deviceId
		let socketCheck = await checkIfSocketActive(adminId,deviceId)
		if(socketCheck == true){
			
			let getAdmins = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"admin-profiles"})
			let admins = getAdmins.body 
			let admin = admins.find((admins)=>{
				admins.id === adminId
			})
			
			if(admin){				
				response.send(JSON.stringify({"status":"success","data":admin}))
			}else{
				response.send(JSON.stringify({"status":"server-error"}))
			}
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/get-admin-data-controller",async(request,response)=>{
	try{
		
		let data = request.body 
		let accessorId = data.accessorId 
		let deviceId = data.deviceId
		let socketCheck = await checkIfSocketActive(accessorId,deviceId)
		if(socketCheck == true){
			
			let getAdminDataController = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"admin-data-controller"})
			
			response.send(JSON.stringify({"status":"success","data":getAdminDataController.body}))
			
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/update-admin-data-controller",async(request,response)=>{
	try{
		
		let data = request.body 
		let accessorId = data.accessorId 
		let deviceId = data.deviceId
		let socketCheck = await checkIfSocketActive(accessorId,deviceId)
		if(socketCheck == true){
			await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"admin-data-controller"},{$set:{"body":data.adminDataController}})
			response.send(JSON.stringify({"status":"success"}))
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

async function generatePerformanceChartData(type,adminDataController,selectedDate){
	
	let output;
	
	try{		
		
		let getSubs = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"subscribed-users"})
		let input = getSubs.body 
		let subs = await filterSubsForDate(input,selectedDate)
		
		let distribution = {}
		
		for(var i=0; i<subs.length; i++){
			let sub = subs[i]
			let date = sub.dateCreated
			let names = distribution.keys 
			let input;
			if(date.date < 10){
				input = `0${date.date}`
			}else{
				input = `${date.date}`
			}
			if(names.includes(input) == false){
				distribution[input] = sub.value
			}else{
				let old = distribution[input]
				distribution[input] = old+sub.value
			}
		}
		
		output = distribution
		
	}catch{
		output = null
	}
	return output
	
}

app.post("/get-performance-chart-data", async(request,response)=>{
	try{
		
		let data = request.body 
		let adminId = data.adminId 
		let deviceId = data.deviceId
		let socketCheck = await checkIfSocketActive(adminId,deviceId)
		if(socketCheck == true){
			
			let getAdminDataController = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"admin-data-controller"})
			let adminDataController = getAdminDataController.body 
			
			let type = data.type 
			
			let process = await generatePerformanceChartData(type,adminDataController,data.selectedDate)
			
			if(process){
				response.send(JSON.stringify({"status":"success","data":process}))
			}else{
				response.send(JSON.stringify({"status":"server-error"}))
			}
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

async function filterSubsForDate(subs,selectedDate){
	let output = []
	
	for(var i=0 ; i<subs.length; i++){
		
		let sub = subs[i]
		let date = sub.dateStarted
		
		let d1 = date.date
		let m1 = date.month
		let y1 = date.year
		let d2 = selectedDate.date
		let m2 = selectedDate.month
		let y2 = selectedDate.year
		
		if(y1 == y2){
			if(m1 <= m2){
				if(m1 == m2){
					if(d1 <= d2){
						output.push(sub)
					}
				}else{
					output.push(sub)
				}
			}
		}
	}
	
	return output
}

app.post("/get-all-subscription-transactions", async(request,response)=>{
	try{
		
		let data = request.body 
		let adminId = data.adminId 
		let deviceId = data.deviceId
		let socketCheck = await checkIfSocketActive(adminId,deviceId)
		if(socketCheck == true){
			
			let getSubs = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"subscribed-users"})
			let subs = getSubs.body 
			
			let process = await filterSubsForDate(subs,data.selectedDate)
			
			response.send(JSON.stringify({"status":"success","data":process}))
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

async function getOnlineUsers(sockets){
	
	let output = 0
	
	for(var i=0; i<sockets.length; i++){
		let socket = sockets[i]
		if(
			socket.userType === "user" &&
			socket.active == true &&
			socket.alreadyLoggedIn == true 
		){
			output = output+1
		}
	}
	
	return output
	
}



app.post("/get-currently-online-users", async(request,response)=>{
	try{
		
		let data = request.body 
		
		let adminId = data.adminId 
		let deviceId = data.deviceId 
		
		let socketCheck = await checkIfSocketActive(adminId,deviceId)
		
		if(socketCheck == true){			
			let getSockets = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-sockets"})
			let sockets = getSockets.body 
			
			let process = await getOnlineUsers(sockets)
			response.send(JSON.stringify({"status":"success","value":process}))
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/get-total-users", async(request,response)=>{
	try{
		
		let data = request.body 
		let accessorId = data.accessorId 
		let deviceId = data.deviceId 
		let socketCheck = await checkIfSocketActive(accessorId,deviceId)
		if(socketCheck == true){			
			
			let getSockets = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
			let users = getSockets.body 
			
			response.send(JSON.stringify({"status":"success","value":users.length}))
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

/*
"dateStarted":serverTime,
"id":generateSubID(),
"dateEnding":{
	"date":serverTime.date,
	"month":serverTime.month,
	"year":serverTime.year+1,
	"hours":serverTime.hours,
	"mins":serverTime.mins
},
"value":5.0,
"currency":"USD",
"ownerId":userId

*/

function checkSubDate(sub){
	let output = true
	
	let date = sub.dateEnding
	
	if(date.year != serverTime.year && date.year == serverTime.year+1){
		
		if(date.month == serverTime.month){
			if(date.date <= serverTime.date){
				output = false
			}
		}else{
			output = false
		}
		
	}else{
		output = false
	}
	
	return output
}

async function getSubbedUsers(users){
	let output = {count:0,users:null}
	
	//Get admin data controller
	
	let getAdminData = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"admin-data-controller"})
	let adminData = getAdminData.body 
	
	let subscriptions = adminData.subscriptions 
	
	for(var i = 0; i<subscriptions.length; i++){
		
		let sub = subscriptions[i]
		
		let check = checkSubDate(sub)
		
		if(check == false){
			
			let user = users.find((user)=>{
				users.id === sub.ownerId
			})
			user.subscribed = false
		}
		
	}
	
	for(var i=0; i<users.length; i++){
		let user = users[i]
		if(user.subscribed == true){
			output = output + 1
		}
	}
	
	output.users = users
	
	return output
}

app.post("/get-subscribed-users", async(request,response)=>{
	try{
		
		let data = request.body 
		let accessorId = data.accessorId 
		let deviceId = data.deviceId
		let socketCheck = await checkIfSocketActive(accessorId,deviceId)
		if(socketCheck == true){			
			
			let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
			let users = getUsers.body 
			
			let process = await getSubbedUsers(users)
			
			await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"user-profiles"},{$set:{"body":process.users}})
			
			response.send(JSON.stringify({"status":"success","value":process.count}))
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

async function processFilesQueue(files,project,date,uploader,fileName){
	
	if(project.updateQueue){
		project.updateQueue.push({
			"date": date,
			"files":files
		})
	}else{
		project["updateQueue"] = []
		project.updateQueue.push({
			"date": date,
			"files":files,
			"updaterId":uploader,
			"fileName": fileName
		})
	}
	
	return project
}

app.post("/synchronise-project-data", async(request,response)=>{
	try{
		
		let data = request.body 
		let date = data.date
		let accessorId = data.accessorId
		let ownerId = data.ownerId
		let fileName = data.fileName
		let projectId = data.projectId
		let deviceId = data.deviceId
		let zipFile = data.file 
		let files = data.metaData 
		
		let socketCheck = await checkIfSocketActive(accessorId,deviceId)
		
		if(socketCheck == true){
			
			let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
			let users = getUsers.body 
			let projectOwner = users.find((users)=>{
				users.id === ownerId
			})
			let projects = projectOwner.projects 
			
			let project = projects.find((projects)=>{
				projects.id === projectId
			})
			
			let projectIndex = projects.find((projects)=>{
				projects.id === projectId
			})
			
			let updatedProject = await processFilesQueue(files,project,date,accessorId,fileName)
			
			projects[projectIndex] = updatedProject
			
			await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"user-profiles"},{$set:{"body":users}})
			
			var proceed = true
			
			file.mv(__dirname+`/User Data/${ownerId}/Data/${fileName}`,(error)=>{
				if(error){
					proceed = true
				}
			})
			
			if(proceed == true){
				
				response.send(JSON.stringify({"status":"success"}))
				
			}else{
				response.send(JSON.stringify({"status":"server-error"}))
			}
			
			
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/delete-queue-data",async(request,response)=>{
	try{
		let accessorId = data.accessorId 
		let deviceId = data.deviceId
		let projectOwner = data.projectOwner 
		let fileName = data.fileName 
		let socketCheck = await checkIfSocketActive(accessorId,deviceId)
		if(socketCheck == true){
			
			fs.deleteFileSync(__dirname+`/User Data/${projectOwner}/Data/${fileName}.zip`)
			response.send(JSON.stringify({"status":"success"}))
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
	}
	catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.get("/get-queue-object-files/:id", async(request,response)=>{
	try{
		
		let accessorId = request.params.id 
		
		let socketCheck = await checkIfSocketActive(accessorId)
		
		if(socketCheck == true){
			
			let getSockets = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-sockets"});
			
			let sockets = getSockets.body 
			
			let socket = sockets.find((sockets)=>{
				return sockets.userId === accessorId
			})
			
			let name = socket.id
			let format = socket.format
			let ownerId = socket.ownerId 
			
			let stream = fs.createReadStream(__dirname+`/User Data/${ownerId}/Data/${name}.${format}`)
			
			stream.pipe(response)
			
		}else{
			response.sendStatus(404)
		}
		
	}catch{
		response.sendStatus(404)
	}
})


app.get('/download-app',(req,res)=>{
	try{
		const apkPath = path.join(__dirname,'Software','CriterianDeveloper.apk');
		if(!fs.existsSync(apkPath)){
			console.log("failed")
			return res.status(404).json({message:'APK not found'});
		}
		res.setHeader('Content-Type','application/vnd.android.package-archive');
		res.setHeader('Content-Disposition','attachment; filename="CriterianDeveloper.apk"');
		fs.createReadStream(apkPath).pipe(res);
	}catch(err){
		console.error(err);
		res.status(500).json({message:'download failed'});
	}
});


async function generateEmailCode(user){
	let output = "CS-";
	
	let array = [0,1,2,3,4,5,6,7,8,9]
	for(var i=0; i<4; i++){
		array.shuffle()
		output = `${output}${array[0]}`
	}
	
	let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
	let users = getUsers.body
	let userx = users.find((users)=>{
		users.id === user.id
	})
	await timeProcessor()
	userx.verificationCode = {code: output,time:serverTime}
	await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"user-profiles"},{$set:{"body":users}})
	
	return output
}

setTimeout(async()=>{
	//check users for expired verification codes 
	await timeProcessor()
	
	let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
	let users = getUsers.body
	
	for(var i=0; i<users.length; i++){
		let user = users[i]
		let x = user.verificationCode
		if(x){
			if(serverTime.hours == x.time.hours){
				if(serverTime.mins >= x.time.mins+10){
					user.verificationCode = null
				}
			}else{
				users[i].verificationCode = null
			}
		}
	}
	
	await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"user-profiles"},{$set:{"body":users}})
	
},30000)

// 1. Configure the Mail Transporter
// Replace with your actual SMTP details (Gmail, Outlook, or Mailtrap)
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: 'criterionprogramming@gmail.com',
        pass: 'G-908367' 
    }
});

async function SendEmail(user,code){
	
	let output = false
	
	const mailOptions = {
        from: '"Criterian Developer" criterionprogramming@gmail.com',
        to: emailAddress,
        subject: `${user.firstName} ${user.lastName} - Your Verification Code`,
        text: `Dear ${user.firstName} ${user.lastName} <br><br> Your verification code is: ${code} <br> Please be advised that this code will expire in the next 10 minutes.`,
        html: `<b>Your verification code is: <span style="font-size: 20px;">${code}</span></b><br><p>This code expires in 10 minutes.</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        output = true
    } catch (error) {
        console.error('Email Error:', error)
    }
	
	
	return output 
}

app.post("/generate-verification-code", async(request,response)=>{
	try{
		
		let data = request.body 
		let accessorId = data.accessorId
		let emailAddress = data.emailAddress 
		let deviceId = data.deviceId 
		
		let socketCheck = await checkIfSocketActive(accessorId,deviceId)
		
		if(socketCheck == true){
			
			let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
			let users = getUsers.body 
			let user = users.find((users)=>{
				users.emailAddress === emailAddress
			})
			if(user){
				
				if(!user.verificationCode || user.verificationCode == null){					
					
					let code = await generateEmailCode(user)
					
					let sendEmail = await SendEmail(user,code)
					
					if(sendEmail == true){					
						response.send(JSON.stringify({"status":"success"}))
					}else{
						response.send(JSON.stringify({"status":"server-error"}))
					}
				}
				
				
			}else{
				response.send(JSON.stringify({"status":"not-found"}))
			}
			
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/check-verification-code", async(request,response)=>{
	try{
		
		let data = request.body
		let accessorId = data.accessorId
		let emailAddress = data.emailAddress
		let deviceId = data.deviceId
		let code = data.code 
		
		let socketCheck = await checkIfSocketActive(accessorId,deviceId)
		
		if(socketCheck == true){
			let getUsers = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"user-profiles"})
			let users = getUsers.body 
			let user = users.find((users)=>{
				users.emailAddress === emailAddress
			})
			
			let x = user.verificationCode.code 
			if(x === code){
				user.verificationCode = null
				user.verified = true
				await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"user-profiles"},{$set:{"body":users}})
				response.send(json({"status":"success"}))
			}else{
				response.send(json({"status":"invalid-code"}))
			}
		}else{
			response.send(JSON.stringify({"status":"server-error"}))
		}
		
	}catch{
		response.send(JSON.stringify({"status":"server-error"}))
	}
})

app.post("/transfer-purchase-data", async(request,response)=>{
	try{
		
		let data = request.body
		let accessorId = data.accessorId
		let deviceId = data.deviceId
		let socketCheck = await checkIfSocketActive(accessorId,deviceId)
		
		if(socketCheck == true){
			
			let x = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"purchase-transfer-requests"})
			let requests = x.body 
			
			requests.push(data.request)
			
			await mongoClient.db("CriterionDev").collection("MainData").updateOne({"name":"purchase-transfer-requests"},{$set:{"body":requests}})
			
			response.send(json({"status":"success"}))
			
		}else{
			response.send(json({"status":"server-error"}))
		}
		
	}catch{
		response.send(json({"status":"server-error"}))
	}
})

app.post("/get-purchase-data", async(request,response)=>{
	try{
		let data = request.body
		let accessorId = data.accessorId
		let deviceId = data.deviceId
		let jobId = data.id
		let socketCheck = await checkIfSocketActive(accessorId,deviceId)
		
		if(socketCheck == true){
			
			let x = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"purchase-transfer-requests"})
			let requests = x.body 
			let requestx = requests.find((requests)=>{
				requests.jobId === jobId
			})
			if(requestx){
				response.send(json({"status":"success","data":requestx}))
			}else{
				response.send(json({"status":"server-error"}))
			}
		}else{
			response.send(json({"status":"server-error"}))
		}
	}catch{
		response.send(json({"status":"server-error"}))
	}
})

app.post("/check-feature-availability",async(request,response)=>{
	try{
		let data = request.body
		let accessorId = data.accessorId
		let deviceId = data.deviceId
		let socketCheck = await checkIfSocketActive(accessorId,deviceId)
		
		if(socketCheck == true){
			
			let getData = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"features-available"})
			let features = getData.body
			let output = null
			if(data.type === "AI Assist"){
				output = features.aiAssist
			}
			if(data.type === "Check Out Systems"){
				output = features.checkOut
			}
			response.send(json({status:"success",data:output}))
		}else{
			response.send(json({"status":"server-error"}))
		}
	}catch{
		response.send(json({"status":"server-error"}))
	}
})

app.get("/get-app-current-version", async(request,response)=>{
	try{
		let getData = await mongoClient.db("CriterionDev").collection("MainData").findOne({"name":"features-available"})
		let features = getData.body
		response.send(json({"status":"success","version":features.version}))
	}catch{
		response.send(json({"status":"server-error"}))
	}
})

async function processAIRequest(request) {
	
	let output = null
	
	let ins = "1) Present all results in strictly json object format"+
	"2) design an html page - with all relevant image links (in img objects) and code snippets - both from source files and generated content  - output it as a string to be loaded into android WebView object"+
	"3) json object should be formatted: {response: html_page_string, files: [(same object format as inputed objects but with modified code where neccessary)]}"+
	"4) input is in json object form. actual question asked will be referenced by the key: queryInput"
	try {
		const response = await client.responses.create({
		model: "gpt-5.5", // Use your desired target model
		instructions: ins,
		input: request
		});
	
		output = response.output_text
	} catch (error) {
		console.error("Error communicating with OpenAI:", error.message);
	}
	
	return output
}


app.post("/post-ai-assist-request", async(request,response)=>{
	try{
		
		let data = request.body
		let accessorId = data.accessorId
		let deviceId = data.deviceId
		let request = data.request
		let socketCheck = await checkIfSocketActive(accessorId,deviceId)
		
		if(socketCheck == true){
			
			let process = await processAIRequest(request)
			
			if(process){				
				response.send(json({"status":"success","data":process}))
			}else{
				response.send(json({"status":"server-error"}))
			}
			
		}else{
			response.send(json({"status":"server-error"}))
		}
		
	}catch{
		response.send(json({"status":"server-error"}))
	}
})

async function maintenanceProcess(){
	let getData = await fetch("https://youthempowermentapp.onrender.com/check-maintenance")
	let data = await getData.json()
	let status = data.status
	console.log("Maintenance Status -->"+status)	
}
	
//setInterval(async()=>{ await maintenanceProcess()},1000*30)

server.listen(port)