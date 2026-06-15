/*Criterion Programming Customer Collection Portal*/

/*Global Variables*/

let alreadyLogged = false

let breakDowns = {
	1:[
		"Data Base & Structure Design",
		"Server Design & Server Logic Programming",
		"User Interface Design & Client Side Logic Programming",
		"Server Setup and Upload",
		"Payment gateway intergration (optional)",
		"Life Time Server Maintainance"
	],
	2:[
		"Data Base & Structure Design",
		"Server Design & Server Logic Programming",
		"User Interface Design & Client Side Logic Programming",
		"Server Setup and Upload",
		"Payment gateway intergration (optional)",
		"Life Time Server Maintainance"
	],
	3:[
		"Data Base & Structure Design",
		"Server Design & Server Logic Programming",
		"User Interface Design & Client Side Logic Programming",
		"Server Setup and Upload",
		"Payment gateway intergration",
		"Life Time Server Maintainance"
	],
	4:[
		"Data Base & Structure Design",
		"Server Design & Server Logic Programming",
		"User Interface Design & Client Side Logic Programming",
		"Server Setup and Upload",
		"Payment gateway intergration (optional)",
		"Life Time Server Maintainance"
	],
	5:[
		"Data Base & Structure Design",
		"Server Design & Server Logic Programming",
		"App User Interface Design & Logic Programming",
		"Server Setup and Upload",
		"Payment gateway intergration (optional)",
		"Life Time Server Maintainance"
	],
	6:[
		"Data Base & Structure Design",
		"Server Design & Server Logic Programming",
		"Desktop App User Interface Design & Logic Programming",
		"Android Setup and Upload",
		"Payment gateway intergration (optional)",
		"Life Time Server Maintainance"
	]
}

let selectedUpdate = {
	"id":null,
	"message": null,
	"date":null,
	"seen": false,
	"zip":null
}

let screenshots = []
let unfinishedQueue = []

let selectedFeedback = {
	"id":null,
	"message": null,
	"date":null,
	"seen": false,
	"screenshots":[],
	"unfinishedQueue":[]
}

let selectedCurrency = "USD"

let convertedValue = 0.00

let jobID = null

let paymentValue = 0.00

let payInFull = false

let selectedPackage = null

let selectedJob = {
            "id": null,
			"ownerId":null,
            "name":"",
            "description": null,
            "updates":[],
			"feedback":[],
			"payments":[],
			"type":"",
            "status":"pending payment",
			"currency":"USD",
			"installmentPaid":false,
			"dateDue" : null, 
			"dateCreated" : null,
			"addOptionOne":false,
			"addOptionTwo":false,
			"addOptionThree":false
        }
		
let newPayment = {
	"id":null,
	"date":null,
	"value":0.00,
	"currency": null,
	"firstInstallment": false
} 

let addOnSwitches = {
	"addOnOne": false,
	"addOnTwo": false,
	"addOnThree": false
}

let priceList = {
	"optionDefault": 0.00, 
	"optionOne": 500.00, 
	"optionTwo": 500.00, 
	"optionThree": 300.00, 
	"optionFour": 700.00, 
	"optionFive": 1000.00, 
	"optionSix": 1000.00, 
	"optionSeven": 2000.00, 
	"addOnOne": 100.00,
	"addOnTwo": 200.00,
	"addOnThree": 300.00
}

function changeText(newText,view){
	
	view.style.opacity = "0";
	
	setTimeout(()=>{
		
		view.innerHTML = newText;
		
		setTimeout(()=>{
			
			view.style.opacity = "1"
			
		},50)
		
	},150)
	
}

async function getConvertedValue( value ){
    let output;
    try{
        
        if(selectedCurrency == "USD"){
            output = value
        }else{
            let req = await fetch("/get-conversion",{
                "method":"POST",
                "body":JSON.stringify({"code" : selectedCurrency}),
                "headers" : {"Content-Type" : "application/json"}
            })
            
            let res = await req.json()
            
            output = res.value
        }
        
    }catch{
		output = value
		selectedCurrency = "USD"
		currencyText.innerHTML = selectedCurrency
        alert("Failure converting currency . Please check your internet connection.")
    }
    
    return output
}

async function priceCalculator(option){
	
	let output = 0.00
	
	let price = priceList[option]
	
	let switches = addOnSwitches
	
	if(option != "optionDefault"){
		if(switches.addOnOne == true){
			let newPrice = price + priceList.addOnOne
			price = newPrice
		}
		if(switches.addOnTwo == true){
			let newPrice = price + priceList.addOnTwo
			price = newPrice
		}
		if(switches.addOnThree == true){
			let newPrice = price + priceList.addOnThree
			price = newPrice
		}
	}
	
	selectedJob.value = price
	
	convertedValue = await getConvertedValue(price)
	
	if(selectedCurrency == "USD"){
		
		projectValue.innerHTML = `${selectedJob.value}`
	
	}else{
		
		projectValue.innerHTML = `${convertedValue}`
		
	}
	
	return price
	
}

function getFirstInstallment(value){
	let output = null
	if(selectedJob.payments.length == 0){
		if(payInFull == false){
			output = Math.floor(value * 0.35)
		}else{
			output = Math.floor((value *0.93) * 0.35)
		}
	}else{
		let payments = selectedJob.payments
		if(payments.length != 4){
			
			let first_payment;
			for(var i=0; i<payments.length; i++){
				let payment = payments[i]
				if(payment.firstInstallment == true){
					first_payment = payment
				}
			}
			
			let less_first = selectedJob.value - first_payment.value
			
			output = Math.floor((less_first/4))
		}else{
			let total = 0
			for(var i=0; i<payments.length; i++){
				let payment = payments[i]
				total = total + payment.value
			}
			output = selectedJob.value - total
		}
	}
	
	return output
}


let userData = null 

let userModes = {
	"admin": false,
	"user": true
}

//Socket io intergration

let socket = io();

socket.on("ping",async()=>{
	if(userData){
		
		socket.emit("affirm",{"userId":userData.id})
	
	}
	
	
})


let defaultHeight;
let transferWidth;


window.addEventListener("resize" , ()=>{
	
	let widthString = `${window.innerWidth}px`
	let heightString = defaultHeight
	
	let body = document.getElementById("mother");
	
	body.style.width = widthString;
	body.style.height = heightString;
	
});

window.addEventListener("load" , ()=>{
	
	let widthString = `${window.innerWidth}px`
	transferWidth = window.innerWidth;

	defaultHeight = `${window.innerHeight}px`
	
	let body = document.getElementById("mother");

	
	
	body.style.width = widthString;
	body.style.height = defaultHeight;
});

//time and date functions

let date = new Date()

let time = {
	"date":date.getDate(),
	"month":date.getMonth(),
	"year":date.getFullYear(),
	"hours":date.getHours(),
	"mins":date.getMinutes()
}

async function refreshDate(){
	let date = new Date()
	time.date = date.getDate()
	time.month = date.getMonth()
	time.year = date.getFullYear()
	time.hours = date.getHours()
	time.mins = date.getMinutes()
}

setTimeout(refreshDate,1000)

let monthsArray = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August", 
        "September",
        "October",
        "November",
        "December"
    ]
    
let monthData = [
		{
			"name":"January",
			"days":31
		},
		{
			"name":"February",
			"days":28
		},
		{
			"name":"March",
			"days":31
		},
		{
			"name":"April",
			"days":30
		},
		{
			"name":"May",
			"days":31
		},
		{
			"name":"June",
			"days":30
		},
		{
			"name":"July",
			"days":31
		},
		{
			"name":"August",
			"days":31
		},
		{
			"name":"September",
			"days":30
		},
		{
			"name":"October",
			"days":31
		},
		{
			"name":"November",
			"days":30
		},
		{
			"name":"December",
			"days":31
		}
	];
	
async function getAmountDue(){
	
    let output = 0.00 
    
    if(selectedJob.id != null){
			
		if(selectedJob.payments.length > 0){
			
			let payments = selectedJob.payments 
			let total_val = 0.0 
			
			for(var i=0; i<payments.length; i++){
				
				let newVal = total_val + payments[i].value
				total_val = newVal

			}
			if(payInFull == false){
				output = await getConvertedValue(selectedJob.value)
			}else{
				let y = await getConvertedValue(selectedJob.value)
				output = y * 0.93
			}
			
        }else{
			if(payInFull == false){
				output = convertedValue
			}else{
				let y = convertedValue
				output = Math.floor(y *0.93)
			}
			
		}
		
    }else{
        
        output = convertedValue
        
    }
    
    return output
}	

async function getTotalPaid(){
	
	let output = 0.0
	
	let payments = selectedJob.payments 
	
	if(payments.length > 0){
		for(var i=0; i<payments.length; i++){
			let payment = payments[i]
			let value = payment.value
			output = output + value 
		}
	}
	
	return output
	
}
	
function calculateDueDate(){
    let output = {
        "date": null,
        "month" : null,
        "year" : null,
        "hours" : time.hours,
        "mins" : time.mins
    }
    
    let currentMonth = time.month 
    
    let monthEndData = monthData.find((monthData)=>{
        return monthData.name === monthsArray[currentMonth]
    })
    
    let monthEnd = monthEndData.days 
    
    let daysLeft = monthEnd - time.date 
    
    let endDate = 30 - daysLeft 
    
    output.date = endDate 
    
    if(time.month < 11){
        output.month = time.month+1
    }else{
        output.month = 0
        output.year = time.year + 1
    }
    
    selectedJob.dateDue = output
    
    return output
}	

function getDateString( date ){
    return `${date.date}/${monthsArray[date.month]}/${date.year}`
}

// Main Elements

let headerSect = document.getElementById("header")
let backgroundPic = document.getElementById("backgroundImage")
let startPage = document.getElementById("StartPage")
let welcomeScreen = document.getElementById("WelcomeAnimation")
let mainDsp = document.getElementById("shapeArea")
let mainDspShape = document.getElementById("shape")
let startBtn = document.getElementById("loginBtnMain") 

/*Menu Elements*/

let menuLoginBtn = document.getElementById("menuLogin")
let menuAddJob = document.getElementById("menuAddJob")
let menuViewProjects = document.getElementById("menuViewProjects")
let menuChangePassword = document.getElementById("menuChangePassword")
let menuAddAdmin = document.getElementById("menuAddAdmin")
let menuLogout = document.getElementById("menuLogout")

const setPriviledges = ()=>{
	if(userData != null){
		if(userModes.user == true){
			menuLoginBtn.style.display = "none"
			menuAddJob.style.display = "block"
			menuViewProjects.style.display = "block"
			menuChangePassword.style.display = "block"
			menuAddAdmin.style.display = "none"
			menuLogout.style.display = "block"
		}else{
			menuAddJob.style.display = "block"
			menuLoginBtn.style.display = "none"
			menuViewProjects.style.display = "block"
			menuChangePassword.style.display = "block"
			menuAddAdmin.style.display = "block"
			menuLogout.style.display = "block"
		}
	}else{
		menuAddJob.style.display = "block"
		menuLoginBtn.style.display = "block"
		menuViewProjects.style.display = "none"
		menuChangePassword.style.display = "none"
		menuAddAdmin.style.display = "none"
		menuLogout.style.display = "none"
	}
}

setPriviledges()

menuLogout.addEventListener("click",()=>{
	
	if(mainSwapped == true){
		LogOutUser()
		menuBtnMain.click()
	}
	
});
menuLogin.addEventListener("click",()=>{
	if(alreadyLogged == false){
		if(mainSwapped == true){
			swapPages(0)
			menuBtnMain.click()
		}
	}
})
menuAddJob.addEventListener("click",()=>{
	if(mainSwapped == true){		
		selectedJob = {
            "id": null,
			"ownerId":null,
            "name":"",
            "description": null,
            "updates":[],
			"feedback":[],
			"payments":[],
			"type":"",
            "status":"pending payment",
			"currency":"USD",
			"installmentPaid":false,
			"dateDue" : null, 
			"dateCreated" : null,
			"addOptionOne":false,
			"addOptionTwo":false,
			"addOptionThree":false
        }
		swapPages(1)
		menuBtnMain.click()
	}
})
menuViewProjects.addEventListener("click",()=>{
	if(mainSwapped == true){
		swapPages(3)
		menuBtnMain.click()
	}
})
menuAddAdmin.addEventListener("click",()=>{
	if(mainSwapped == true){		
		swapPages(8)
		menuBtnMain.click()
	}
})
menuChangePassword.addEventListener("click",()=>{
	if(mainSwapped == true){
		swapPages(7)
		menuBtnMain.click()
	}
})

//User Login 

let userLogin = document.getElementById("userLoginSection")
let adminSwitch = document.getElementById("adminBtn")
adminSwitch.checked = false
let userIdInput = document.getElementById("userIdInput") 
let userPasswordInput = document.getElementById("userPasswordInput")
let loginInit = document.getElementById("loginInit")
let forgotPasswordBtn = document.getElementById("forgotPasswordBtn")

forgotPasswordBtn.addEventListener("click",()=>{
	swapPages(7)
})

adminSwitch.addEventListener("click",()=>{
	if(adminSwitch.checked){
		userModes.admin = true
		userModes.user = false
	}else{
		userModes.admin = false
		userModes.user = true
	}
})

//Add Admin 

let yfirstName = document.getElementById("adminFirstNaemInput")
let ylastName = document.getElementById("adminLastNaemInput")
let yemail = document.getElementById("adminInput")
let ypassword = document.getElementById("adminPasswordInput")
let ypasswordConfirm = document.getElementById("adminConfirmPasswordInput")
let ysecretQstn = document.getElementById("adminScrtQstnInput")
let ysecretQstnAnswer = document.getElementById("adminScrtQstnAnsInput")
let addAdminBtn = document.getElementById("adminInit")
let addAdminSection = document.getElementById("addAdminSection")

let newAdmin = {
	"id":null,
	"emailAddress": null,
	"secretQuestion": null,
	"secretQuestionAnswer": null,
	"firstName": null,
	"lastName": null,
	"password":null
}

function ProcessAdminInputs(){
	
	let output = false
	
	openLoadingWindow()
    
    let xpassword = ypassword.value
    let xemail = yemail.value
    let xconfirmPassword = ypasswordConfirm.value 
    let xfirstName = yfirstName.value
    let xlastName = ylastName.value 
    let xsecrtQstn = ysecretQstn.value
    let xsecrtQstnAnswr = ysecretQstnAnswer.value
    
    let one = false
    let two = false
    let three = false
    let four = false
    let five = false
    let seven = false
    let eight  = false
    let nine = false
    
    
    let textOnlyRegex = /[A-Za-z]/
    let looseRegex = /[A-Za-z0-9]/
    let emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
	let passwordRegex = /[A-Za-z0-9]/
    if(
        xpassword != null &&
        xpassword !="" &&
        xconfirmPassword != null &&
        xconfirmPassword != "" &&
        xfirstName != null &&
        xfirstName != "" &&
        xlastName != null && 
        xlastName != "" &&
		xemail != null && 
        xemail != ""&&
		xsecrtQstn != null && 
        xsecrtQstn != "" &&
		xsecrtQstnAnswr != null && 
        xsecrtQstnAnswr != "" 
    ){
        
        if(
            xpassword === xconfirmPassword
        ){
            
        
            if(passwordRegex.test(xpassword) == true){
                if(xpassword.length >= 8){
                    one = true
                }
            }
            
            
            if(textOnlyRegex.test(xfirstName)== true){
        
                two = true
        
            }
            if(textOnlyRegex.test(xlastName)== true){
        
                three = true
        
            }
            
			
			if(emailRegex.test(xemail) == true){
				seven = true
			}
			
			if(looseRegex.test(xsecrtQstn) == true){
				eight = true
			}
			if(looseRegex.test(xsecrtQstnAnswr) == true){
				nine = true
			}
            
            //final eval 
            
            if(
                one == true &&
                two == true &&
                three == true &&
                eight == true &&
                nine == true &&
				seven == true 
            ){
				newAdmin.firstName = xfirstName
				newAdmin.lastName = xlastName
				newAdmin.password = xpassword
				newAdmin.emailAddress = xemail
				newAdmin.secretQuestion = xsecrtQstn
				newAdmin.secretQuestionAnswer = xsecrtQstnAnswr
				newAdmin.emailAddress = xemail
				
				ypasswordConfirm.style["border-bottom"] = "3px solid #376ca8 "
				yfirstName.style["border-bottom"] = "3px solid #376ca8 "
				ylastName.style["border-bottom"] = "3px solid #376ca8 "
				
				ypassword.style["border-bottom"] = "3px solid #376ca8 "
				
				
                output = true
            }else{
                if(one == false){
                    alert("Passwords must contain atleast 8 characters including 1 number without special characters")
					ypassword.style["border-bottom"] = "3px solid red"
					addConfirmPassword.style["border-bottom"] = "3px solid red"
                }
                if(two == false){
                    alert("First name input can only contain letters")
					yfirstName.style["border-bottom"] = "3px solid red"
                }
                if(three == false){
                    alert("Last name input can only contain letters")
					ylastName.style["border-bottom"] = "3px solid red"
                }
                
				if(seven == false){
                    alert("Please type in a valid email address")
					yemail.style["border-bottom"] = "3px solid red"
                }
				if(eight == false){
                    alert("Secret Question input can only contain letters , numbers and these special characters: \/*?-")
					ysecretQstn.style["border-bottom"] = "3px solid red"
                }
				if(nine == false){
                    alert("Secret Question Answer input can only contain letters , numbers and these special characters: \/*?-")
					ysecretQstnAnswer.style["border-bottom"] = "3px solid red"
                }
            }
            
        }else{
            alert("Passwords do not match")
        }
    
    }else{
        alert("Please fill in all fields with relevant information as required")
    }
	return output
}

addAdminBtn.addEventListener("click",async()=>{
	let process = ProcessAdminInputs()
	if(process == true){
		try{
			
		
			let req = await fetch("/register-admin",{
				"method":"POST",
				"body":JSON.stringify({"data":newAdmin}),
				"headers":{"Content-Type":"application/json"}
			});
			
			let res = await req.json()
			
			let status = res.status
			
			if(status === "success"){
				swapPages(3)
				alert("You have successfully added an admin account. Login with new credentials to login.")
			}else{
				alert("Something went wrong. Please check your internet connection or try again later")
			}
		
		}catch{
			alert("Something went wrong. Please check your internet connection or try again later")
		}
	}
})

//Add new customer section 
let newUserInfoSection = document.getElementById("newUserInfoSection")
let addNewClient = document.getElementById("addNewCustomerSection")
let firstName = document.getElementById("userFirstNameInput") 
let lastName = document.getElementById("userLastNameInput")
let emailInput = document.getElementById("emailInput")
let sqInput = document.getElementById("sqInput")
let sqaInput = document.getElementById("sqaInput")
let projectName = document.getElementById("projectNameInput")
let projectDescription = document.getElementById("projectDesc")
let projectValue = document.getElementById("amountDsp")
let currencyText = document.getElementById("currencyDsp")
let addPassword = document.getElementById("passwordInput")
let addConfirmPassword = document.getElementById("passwordConfirmInput")
let addClient = document.getElementById("addUserInit")
let selector = document.getElementById("jobOptions")
let countrySelectorBtn = document.getElementById("countrySelectHolder")
let countrySelectorText = document.getElementById("countrySelected")

function setUpAddClientSelection(){
	if(userData){
		newUserInfoSection.style.display = "none"
	}else{
		newUserInfoSection.style.display = "block"
	}
	addOnOneBox.checked = false
	addOnTwoBox.checked = false
	addOnThreeBox.checked = false
}

//Additional options
let addOnOneBox = document.getElementById("addConsole1")
let addOnTwoBox = document.getElementById("addConsole2")
let addOnThreeBox = document.getElementById("addConsole3")

addOnOneBox.addEventListener("click",()=>{
	addOnSwitches.addOnOne = addOnOneBox.checked
	selectedJob.addOptionOne = addOnOneBox.checked
	let id = selector.options[selector.selectedIndex].id
	
	let value = priceCalculator(id)
	if(selectedCurrency === "USD"){
	    projectValue.innerHTML = value
	}else{
	    projectValue.innerHTML = convertedValue
	}
})

addOnTwoBox.addEventListener("click",()=>{
	addOnSwitches.addOnTwo = addOnTwoBox.checked
	selectedJob.addOptionTwo = addOnTwoBox.checked
	let id = selector.options[selector.selectedIndex].id
	let value = priceCalculator(id)
	if(selectedCurrency === "USD"){
	    projectValue.innerHTML = value
	}else{
	    projectValue.innerHTML = convertedValue
	}
})

addOnThreeBox.addEventListener("click",()=>{
	addOnSwitches.addOnThree = addOnThreeBox.checked
	selectedJob.addOptionThree = addOnThreeBox.checked
	let id = selector.options[selector.selectedIndex].id
	let value = priceCalculator(id)
	if(selectedCurrency === "USD"){
	    projectValue.innerHTML = value
	}else{
	    projectValue.innerHTML = convertedValue
	}
})


countrySelectorBtn.addEventListener("mousedown",()=>{
	countrySelectorBtn.style.color = "#376ca8"
	countrySelectorBtn.style.border = "3px solid #376ca8"
	countrySelectorBtn.style.background = "white"
})

countrySelectorBtn.addEventListener("mouseup",()=>{
	countrySelectorBtn.style.color = "white"
	countrySelectorBtn.style.border = "none"
	countrySelectorBtn.style.background = "#376ca8"
})

countrySelectorBtn.addEventListener("click",()=>{
	listDialogType = "Country"
	openList()
})

selector.selectedIndex = 0 

selector.addEventListener("change",()=>{
	
	let ad = document.getElementById("addOptionsHolder2")
	
	let id = selector.options[selector.selectedIndex].id
	priceCalculator(id)
	
	
	if(id == "optionDefault"){
		addOnOneBox.checked = false
		addOnTwoBox.checked = false
		addOnThreeBox.checked = false
		ad.style.opacity = "0"
		newPayment.firstInstallment = false
		setTimeout(()=>{
			ad.style.display = "none"
		},300)
		selectedPackage = 0
	}else{
		ad.style.display = "block"
		setTimeout(()=>{
			ad.style.opacity = "1"
		},10)
		newPayment.firstInstallment = true
		if(selector.selectedIndex == 1){
			selectedPackage = 1
		}
		if(selector.selectedIndex == 2){
			selectedPackage = 2
		}
		if(selector.selectedIndex == 3){
			selectedPackage = 3
		}
		if(selector.selectedIndex == 4){
			selectedPackage = 4
		}
		if(selector.selectedIndex == 3){
			selectedPackage = 5
		}
		if(selector.selectedIndex == 6 ){
			selectedPackage = 6
		}
		if(selector.selectedIndex == 7 ){
			selectedPackage = 7
		}
	}
	

})

//reviewSection 
let bDownList = document.getElementById("breakdown-list")
let cancelIcon = document.getElementById("cancelIcon")
let cancelText = document.getElementById("cancelText")
let quickFeedBack = document.getElementById("quickFeedBack")
let reviewSection = document.getElementById("reviewSection")
let reviewIns = document.getElementById("reviewIns")
let adminActiveHolder = document.getElementById("adminActiveHolder")
let adminActiveIcon = document.getElementById("adminActiveIcon")
let adminActiveText = document.getElementById("adminActiveText")
let payNowBtn = document.getElementById("payForJobNow")
let rsPname = document.getElementById("rsPname")
let rsPStatus = document.getElementById("rsPStatus")
let rsPValue = document.getElementById("rsPValue")
let rsPDesc = document.getElementById("rsPDesc")
let rsPClient = document.getElementById("rsPClient")
let rsPClientHeader = document.getElementById("rsPClientHeader")

let rsPBdown = document.getElementById("rsPBdown")
let rsPBdownlist = document.getElementById("rsPBdownlist")

quickFeedBack.addEventListener("click",()=>{
	if(selectedJob.status != "pending payment"){
		if(userModes.admin == false){
			swapPages(4)
		}else{
			swapPages(5)
		}
	}else{
		alert("Sorry. You need to make your first installment to access this facility")
	}
})

cancelIcon.addEventListener("click",()=>{
		
	if(selectedJob.status != "pending payment"){
		if(userModes.user == true){			
			prompt("Are you sure you want to cancel this Job? No refunds will be given. However all files generated upto this point will be transferred within 48 hours",cancelJob,null)
		}else{
			prompt("Are you sure you want to cancel this Job? No refunds will be given. You will have to generate and transfer all associated files within 48 hours",cancelJob,null)
		}
	}else{
		alert("Sorry. Make your first installment to use this facility")
	}
	
})
cancelText.addEventListener("click",()=>{
	if(selectedJob.status != "pending payment"){
		if(userModes.user == true){			
			prompt("Are you sure you want to cancel this Job? No refunds will be given. However all files generated upto this point will be transferred within 48 hours",cancelJob,null)
		}else{
			prompt("Are you sure you want to cancel this Job? No refunds will be given. You will have to generate and transfer all associated files within 48 hours",cancelJob,null)
		}
	}else{
		alert("Sorry. Make your first installment to use this facility")
	}
})

const getUserData = async(ownerId)=>{
	
	let output;
	
	let req = await fetch("/get-fresh-user-data",{
		"method":"POST",
		"body":JSON.stringify({
			"ownerId":ownerId,
			"userId":userData.id
		}),
		"headers":{"Content-Type":"application/json"}
	})
	
	let resy = await req.json()
	
	let status = resy.status 
	
	if(status === "success"){
		output = resy.data
	}else{
		output = null
	}
	
	return output
	
}

let starsX3 = null

const getAstroSigns = async()=>{
	let output = null
	let powerOne = await fetch("/get-power-one/"+userData.id)
	
	let x3 = await powerOne.json()
	console.log(x3)
	if(x3.resolution == true){
		starsX3 = x3.stars
		output = x3.stars
	}
	return output
}

const getUserName = async(userID)=>{
	
	let data = {firstName:null,lastName:null}
	
	if(starsX3 == null){
		let y = await getAstroSigns(userData.id)
		
		let astroSigns = Object.keys(y)
		
		for(var i=0 ; i<astroSigns.length; i ++){
			let x = astroSigns[i]
			if(x === userID){
				data.firstName = y[astroSigns[i]].firstName
				data.lastName = y[astroSigns[i]].lastName
			}
		}
	}else{
		let y = starsX3
		
		let astroSigns = Object.keys(y)
		
		for(var i=0 ; i<astroSigns.length; i ++){
			let x = astroSigns[i]
			if(x === userID){
				data.firstName = y[astroSigns[i]].firstName
				data.lastName = y[astroSigns[i]].lastName
			}
		}
	}
	
	console.log(data)
	
	return `${data.firstName} ${data.lastName}`
}

async function setReviewIndicators(){
	if(userModes.user == true){
		
		rsPClient.style.display = "none"
		rsPClientHeader.style.display = "none"
		
		rsPname.innerHTML = selectedJob.name
		rsPStatus.innerHTML = selectedJob.status
		rsPDesc.innerHTML = selectedJob.description
		rsPValue.innerHTML = await getConvertedValue(selectedJob.value) + ` ${selectedJob.currency}`
		
		if(selectedJob.status == "Live" || selectedJob.status == "Payment Complete" || selectedJob.status == "In Progress" ){
			reviewIns.style.display = "block"
			quickFeedBack.style.display = "block"
		}else{
			reviewIns.style.display = "none"
			quickFeedBack.style.display = "none"
		}
		
	}
	if(userModes.admin == true){
		
		rsPClient.style.display = "block"
		rsPClientHeader.style.display = "block"
		
		let owner = selectedJob.ownerId
		
		rsPClient.innerHTML = await getUserName(owner)
		
		rsPname.innerHTML = selectedJob.name
		rsPStatus.innerHTML = selectedJob.status
		rsPDesc.innerHTML = selectedJob.description
		rsPValue.innerHTML = selectedJob.value + ` USD`
		
		reviewIns.style.display = "block"
		reviewIns.innerHTML = "Please respond as quickly as you can to feedbacks to avoid customer disatisfaction"
		if(userModes.admin == false){			
			quickFeedBack.innerHTML = "Send Message"
		}else{
			quickFeedBack.innerHTML = "Send Update"			
		}
		
		if(selectedJob.status == "Live" || selectedJob.status == "Payment Complete" || selectedJob.status == "In Progress" ){
			reviewIns.style.display = "block"
			quickFeedBack.style.display = "block"
		}else{
			reviewIns.style.display = "none"
			quickFeedBack.style.display = "none"
		}
		
	}
}

function setAdminActiveIndicators(status){
	if(status == true){
		adminActiveHolder.style.background = "#376ca8"
		adminActiveText.style.color = "white"
		adminActiveIcon.style.background = "white"
		adminActiveHolder.style["box-shadow"] ="0px 0px 7px black"
	}else{
		adminActiveHolder.style.background = "#00000059"
		adminActiveText.style.color = "#4f4848"
		adminActiveIcon.style.background = "#00000061"
		adminActiveHolder.style["box-shadow"] ="none"
	}
	
}

socket.on("admin-active",async(data)=>{
	setAdminActiveIndicators(data.status)
	console.log(data)
})

setInterval(async()=>{
	if(userModes.user == true){
		let rqx = await fetch("/check-live-admins")
		let rsx = await rqx.json()
		let status = rsx.status 
		if(status != "server-error"){			
			setAdminActiveIndicators(status)
		}else{
			setAdminActiveIndicators(true)
		}
	}
},700)

let reviewList = document.getElementById("updatesContainer")

let tryAgain = false

const reviewListBuilder = async()=>{
	let list = document.getElementById("updatesContainer")
	list.innerHTML = null
	if(userModes.user == true){
			let updates = selectedJob.updates
			console.log(updates)
			for(var x=0; x<updates.length; x++){
				let update = updates[x]
				
				let container = document.createElement("div")
				container.setAttribute("class","updateCloud")
				container.addEventListener("mousedown",()=>{
					container.style["box-shadow"] = "none"
					container.style["border"] = "1px solid black"
				})
				container.addEventListener("mouseup",()=>{
					container.style["box-shadow"] = "0px 0px 7px black"
					container.style["border"] = "none"
				})
				
				container.addEventListener("click",()=>{
					selectedUpdate = update
					swapPages(4)
				})
				
				let subjectHeader = document.createElement("p")
				subjectHeader.setAttribute("class","infoHeaderOne")
				subjectHeader.innerHTML = "Subject"
				let subjectInfo = document.createElement("p")
				subjectInfo.setAttribute("class","infoDetailOne")
				subjectInfo.innerHTML = `${update.id} - ${selectedJob.name}`
				
				let detailsHeader = document.createElement("p")
				detailsHeader.setAttribute("class","infoHeaderOne")
				detailsHeader.innerHTML = "Message"
				let detailsInfo = document.createElement("p")
				detailsInfo.setAttribute("class","infoDetailOne")
				detailsInfo.innerHTML = update.message
				let date = document.createElement("p")
				date.setAttribute("class","infoDateHeader")
				date.innerHTML = `${getDateString(update.date)}`
				
				let fileDownloadBtn = document.createElement("button")
				fileDownloadBtn.innerHTML = "Download Files"
				fileDownloadBtn.setAttribute("class","fileDownloadBtn")
				fileDownloadBtn.style.width = "200px"
				if(update.zip != null){
					
					fileDownloadBtn.style.background = "none"
					fileDownloadBtn.style.border = "solid 2px #376ca8"
					fileDownloadBtn.style.color = "#376ca8"
					
					fileDownloadBtn.addEventListener("mousedown",()=>{
						fileDownloadBtn.style.background = "#376ca8"
						fileDownloadBtn.style.color = "#white"
					})
					fileDownloadBtn.addEventListener("mouseup",()=>{
						fileDownloadBtn.style.background = "none"
						fileDownloadBtn.style.border = "solid 2px #376ca8"
						fileDownloadBtn.style.color = "#376ca8"
					})
					
				}else{
					
					fileDownloadBtn.style.border = "3px solid gray"
					fileDownloadBtn.style.color = "gray"
					
				}
				
				//Set data
				
				update.seen = true
				
				container.appendChild(subjectHeader)
				container.appendChild(subjectInfo)
				container.appendChild(detailsHeader)
				container.appendChild(detailsInfo)
				container.appendChild(date)
				container.appendChild(fileDownloadBtn)
				
				list.appendChild(container)
			}
		
	}
	if(userModes.admin == true){
		
			
				let feedback = selectedJob.feedback
				for(var x=0; x<feedback.length; x++){
					let update = feedback[x]
					console.log(update)
					let container = document.createElement("div")
					container.setAttribute("class","updateCloud")
					container.addEventListener("mousedown",()=>{
						container.style["box-shadow"] = "none"
						container.style["border"] = "1px solid black"
					})
					container.addEventListener("mouseup",()=>{
						container.style["box-shadow"] = "0px 0px 7px black"
						container.style["border"] = "none"
					})
					
					container.addEventListener("click",()=>{
						selectedFeedback = update
						swapPages(5)
					})
					
					let subjectHeader = document.createElement("p")
					subjectHeader.setAttribute("class","infoHeaderOne")
					subjectHeader.innerHTML = "Subject"
					let subjectInfo = document.createElement("p")
					subjectInfo.setAttribute("class","infoDetailOne")
					subjectInfo.innerHTML = `${update.id} - ${selectedJob.name}`
					
					let detailsHeader = document.createElement("p")
					detailsHeader.setAttribute("class","infoHeaderOne")
					detailsHeader.innerHTML = "Message"
					subjectHeader.setAttribute("class","infoHeaderOne")
					let detailsInfo = document.createElement("p")
					detailsInfo.setAttribute("class","infoDetailOne")
					detailsInfo.innerHTML = update.message
					let date = document.createElement("p")
					date.setAttribute("class","infoDateHeader")
					
					let fileDownloadBtn = document.createElement("button")
					fileDownloadBtn.setAttribute("class","fileDownloadBtn")
					fileDownloadBtn.innerHTML = "Download Screenshots"
					fileDownloadBtn.style.width = "270px"
					if(update.screenshots.length > 0){
						
						fileDownloadBtn.style.background = "none"
						fileDownloadBtn.style.border = "solid 2px #376ca8"
						fileDownloadBtn.style.color = "#376ca8"
						
						fileDownloadBtn.addEventListener("mousedown",()=>{
							fileDownloadBtn.style.background = "#376ca8"
							fileDownloadBtn.style.color = "#white"
						})
						fileDownloadBtn.addEventListener("mouseup",()=>{
							fileDownloadBtn.style.background = "none"
							fileDownloadBtn.style.border = "solid 2px #376ca8"
							fileDownloadBtn.style.color = "#376ca8"
						})
						
					}else{
						
						fileDownloadBtn.style.border = "3px solid gray"
						fileDownloadBtn.style.color = "gray"
						
					}
					
					subjectInfo.innerHTML = `${update.id} - ${selectedJob.name}`
					detailsInfo.innerHTML = update.message
					date.innerHTML = getDateString(update.date)
					update.seen = true
					
					container.appendChild(subjectHeader)
					container.appendChild(subjectInfo)
					container.appendChild(detailsHeader)
					container.appendChild(detailsInfo)
					container.appendChild(date)
					container.appendChild(fileDownloadBtn)
					
					list.appendChild(container)
					
				
				}
			
	}
	
}

function setUpBreakDowns(){
	let type = selectedJob.type
	let list = breakDowns[type-1]
	bDownList.innerHTML = null
	for(var i=0; i<list.length; i++){
		let item = list[i]
		let li = document.createElement("li")
		li.innerHTML = item
		li.setAttribute("class","bItem")
		bDownList.appendChild(li)
	}
	if(selectedJob.addOptionOne == true){
		let li = document.createElement("li")
		li.setAttribute("class","bItem")
		li.innerHTML = "Include customised online website management portal"
		bDownList.appendChild(li)
	}
	if(selectedJob.addOptionTwo == true){
		let li = document.createElement("li")
		li.setAttribute("class","bItem")
		li.innerHTML = "Include customised android management app"
		bDownList.appendChild(li)
	}
	if(selectedJob.addOptionThree == true){
		let li = document.createElement("li")
		li.setAttribute("class","bItem")
		li.innerHTML = "Include customised desktop management app"
		bDownList.appendChild(li)
	}
}

function setUpReviewSection(){
	setUpBreakDowns()
	setReviewIndicators()
	reviewListBuilder()
	if(selectedJob.status === "Cancelled"){
		cancelText.style.display = "none"
		cancelIcon.style.display = "none"
	}
	if(userModes.admin == true){
		adminActiveHolder.style.display = "none"
		payNowBtn.style.display = "none"
		quickFeedBack.innerHTML = "Send Update"
	}
}

/*setInterval(async()=>{
	if(tryAgain == true){
		try{
			let req = await fetch("/update-job",{
				"method":"POST",
				"body":JSON.stringify({
					"userId":userData.id,
					"job": selectedJob,
					"jobId": selectedJob.id
				}),
				"headers":{"Content-Type":"application/json"}
			})
			socket.emit("jobs_updated")
			tryAgain = false
		}catch{
			tryAgain = true
		}
	}
},30000)*/

payNowBtn.addEventListener("click",()=>{
	if(selectedJob.status != "Cancelled"){
		if(convertedValue != 0 && selectedJob.status != "Payment Complete" && selectedJob.status != "Live"){
			newPayment.firstInstallment = false
			swapPages(6)
		}else{
			if(selectedJob.status === "Payment Complete" || selectedJob.status === "Live"){
				alert("Job is already complete")
			}else{			
				alert("Please select a service to continue")
			}
		}
	}
})

//projectsOverview
let projectsOverview = document.getElementById("projectsOverview")
let updatesHeader = document.getElementById("updatesHeader")
let activeProjects = document.getElementById("activeProjects")
let activeProjectsH = document.getElementById("activeProjectsH")
let cancelledProjects = document.getElementById("cancelledProjects")
let cancelledProjectsH = document.getElementById("cancelledProjectsH")
let totalProjectRevenue = document.getElementById("totalProjectRevenue")
let totalProjectRevenueH = document.getElementById("totalProjectRevenueH")
let totalProjectRevenueLost = document.getElementById("totalProjectRevenueLost")
let totalProjectRevenueLostH = document.getElementById("totalProjectRevenueLostH")

const getPaidJobs = async()=>{
	let output = null
	try{
		
		let req = await fetch("/get-paid-jobs",{
			"method":"POST",
			"body":JSON.stringify({
				"userId": userData.id
			}),
			"headers":{"Content-Type":"application/json"}
		})
		
		let res = await req.json()
		
		let status = res.status 
		
		if( status === "success"){
			output = res.data	
		}
		
	}catch{
		alert("Something went wrong. Please check your internet connection or try again later")
	}
	
	return output
}

const setProjectSectionHeaders = async ()=>{
	
	let getUnseenUpdatesSize = ()=>{
		let output = 0
		let array = userData.jobs
		if(array.length > 0){
			for(var i=0; i<array.length;i++){
				let it = array[i]
				let x = it.feedback
				for(var y=0; y<x.length;y++){
					let it = x[y]
					let status = it.seen 
					if(status == true){
						output = (output + 1)
					}
				}
			}
		}
		return output
	}
	let getTotalPurchases = ()=>{
		let output = 0
		let array = userData.jobs
		if(array.length > 0){
			for(var i=0; i<array.length;i++){
				let it = array[i]
				let x = it.value
				let xy = it.status
				if(
					xy ==="In Progress" ||
					xy ==="Payment Complete" ||
					xy ==="Live" 
				){
					output = (output+x)
				}
			}
		}
		return output
	}
	
	let getUnseenFeedbackSize = async()=>{
		let output = 0
		let jobs = await getPaidJobs()
		for(var x=0; x<jobs.length;x++){
				let it = jobs[x]
				let status = it.seen 
				if(status == true){
					output = (output + 1)
				}
		}
		return output
	}
	
	function getValue(payments){
		let output = 0
		for(var x=0; x<payments.length; x++){
			let payment = payments[x]
			output = (output + payment.value)
		}
		return output
	}
	let getAmountsPaid = async()=>{
		let output = 0
		let jobs = await getPaidJobs()
		for(var r=0; r<jobs.length; r++){
			let it = jobs[r]
			let payments = it.payments
			let xy = it.status
			if(
				xy === "In Progress" ||
				xy === "Payment Complete" ||
				xy === "Live" 
			){				
				let process = getValue(payments)
				output = (output + process)
			}
		
		}
		return output
	}
	
	let getActiveProjects = async()=>{
		let output = 0
		if(userModes.user == true && userModes.admin == false ){
			let array = userData.jobs
			for(var i=0; i<array.length;i++){
				let it = array[i]
				let status = it.status 
				if(status === "In Progress" || status === "Live" || status === "Payment Complete"){
					let newx = output +1
					output = newx
					console.log(output)
				}
			}
		}
		else{
			let array = await getPaidJobs()
			for(var i=0; i<array.length;i++){
				let it = array[i]
				let status = it.status 
				if(status === "In Progress" || status === "Live" || status === "Payment Complete"){
					let newx = output +1
					output = newx
				}
			}
		}
		return output
	}
	let getCancelledProjects = async()=>{
		let output = 0
		if(userModes.user == true){
			let array = userData.jobs
			for(var i=0; i<array.length;i++){
				let it = array[i]
				let status = it.status 
				if(status === "Cancelled"){
					let newx = output +1
					output = newx
				}
			}
		}
		else{
			let array = await getPaidJobs()
			for(var i=0; i<array.length;i++){
				let it = array[i]
				let jobs = it.jobs 
				for(var i=0; i<array.length;i++){
					let it = array[i]
					let status = it.status 
					if(status === "Cancelled" ){
						let newx = output +1
						output = newx
					}
				}
			}
		}
		return output
	}
	
	
	if(userModes.user == true && userModes.admin == false){
		activeProjectsH.innerHTML = "Your active projects"
		cancelledProjectsH.innerHTML = "Your cancelled projects"
		cancelledProjectsH.style.display = "block"
		cancelledProjects.style.display = "block"
		totalProjectRevenueLost.style.display = "none"
		totalProjectRevenueLostH.style.display = "none"
		totalProjectRevenueH.innerHTML = "Total Value of Projects Purchased"
		totalProjectRevenue.innerHTML = `${ await getTotalPurchases()} ${selectedCurrency}`
		updatesHeader.innerHTML = `Unseen Updates(${ await getUnseenUpdatesSize()})`
		let activex = await getActiveProjects()
		console.log(activex)
		activeProjects.innerHTML = `${activex} project(s)`
		cancelledProjects.innerHTML = `${await getCancelledProjects()} project(s)`
	}else{
		activeProjectsH.innerHTML = "Active projects"
		cancelledProjectsH.innerHTML = "Cancelled projects"
		cancelledProjectsH.style.display = "block"
		cancelledProjects.style.display = "block"
		totalProjectRevenueH.innerHTML = "Total Projects Revenue"
		totalProjectRevenue.innerHTML = `${ await getAmountsPaid()} ${selectedCurrency}`
		totalProjectRevenueLost.style.display = "block"
		totalProjectRevenueLostH.style.display = "block"
		let activex = await getActiveProjects()
		
		activeProjects.innerHTML = `${activex} project(s)`
		cancelledProjects.innerHTML = `${await getCancelledProjects()} project(s)`
		updatesHeader.innerHTML = `Unseen Feedback(${ await getUnseenFeedbackSize()})`
	}
}

const cancelJob = async()=>{
	openLoadingWindow()
	selectedJob.status = "Cancelled"
	let req = await fetch("/update-job",{
		"method":"POST",
		"body":JSON.stringify({
			"userId":userData.id,
			"jobId": selectedJob.id,
			"update":selectedJob
		}),
		"headers":{"Content-Type":"application/json"}
	})
	let res = await req.json()
	let status = res.status 
	
	if(status == true){
		socket.emit("jobs_updated")
		selectedJob = res.data
		let jobs = userData.jobs
		let search = jobs.findIndex((jobs)=>{
			return jobs.id === selectedJob.id
		})
		userData.jobs[search] = selectedJob
		setUpReviewSection()
		setTimeout(()=>{
			let message;
			if(userModes.user == true){
				message = "Job has been cancelled successfully. You will be able to download your files within 48 hours"
			}else{
				message = "Job has been cancelled successfully. Please send user files within 48 hours"		
			}
			alert(message)
		},700)
	}
}



const projectListBuilder = async()=>{
	
	let list = document.getElementById("projectsContainer")
	list.innerHTML = null
	
	if(userModes.admin == true){
	
		let jobs = await getPaidJobs()
		
		if(jobs != null && jobs.length > 0){
		
			for(var x=0; x<jobs.length; x++){
				let job = jobs[x]
				
				let container = document.createElement("div")
				container.setAttribute("class","updateCloud")
				container.addEventListener("mousedown",()=>{
					container.style["box-shadow"] = "none"
					container.style["border"] = "1px solid black"
				})
				container.addEventListener("mouseup",()=>{
					container.style["box-shadow"] = "0px 0px 7px black"
					container.style["border"] = "none"
				})
				
				container.addEventListener("click",async()=>{
						selectedJob = job
						selectedCurrency = selectedJob.currency
						convertedValue = await getConvertedValue(selectedJob.value)
						swapPages(2)
				})
				
				let clientName = document.createElement("p")
				clientName.setAttribute("class","infoDetailsOne")
				let clientNameHeader = document.createElement("p")
				clientNameHeader.setAttribute("class","infoHeaderOne")
				clientNameHeader.innerHTML = "Client Name"
				let user = job.ownerId
				clientName.innerHTML = `${await getUserName(user)}`
				
				let projectName = document.createElement("p")
				projectName.setAttribute("class","infoDetailsOne")
				let projectNameHeader = document.createElement("p")
				projectNameHeader.innerHTML = "Name"
				projectNameHeader.setAttribute("class","infoHeaderOne")
				
				projectName.innerHTML = job.name
				
				let projectID = document.createElement("p")
				projectID.setAttribute("class","infoDetailsOne")
				let projectIDHeader = document.createElement("p")
				projectIDHeader.setAttribute("class","infoHeaderOne")
				projectIDHeader.innerHTML = "Project ID"
				
				projectID.innerHTML = job.id
				
				let dateCreated = document.createElement("p")
				dateCreated.setAttribute("class","infoDateHeader")
				dateCreated.innerHTML = "Date Created " + getDateString(job.dateCreated)
				
				let dateDue= document.createElement("p")
				dateDue.setAttribute("class","infoDateHeader")
				if(job.status != "pending payment"){
					
					dateDue.innerHTML = "Date Due " + getDateString(job.dateDue)
				
				}else{

					dateDue.innerHTML = "Make first payment to get due date"
					
				}
				
				let statusText = document.createElement("p")
				statusText.setAttribute("class","infoDetailsOne")
				let statusHeader = document.createElement("p")
				statusHeader.setAttribute("class","infoHeaderOne")
				
				statusHeader.innerHTML = "Job Status"
				statusText.innerHTML = job.status
				
				container.appendChild(clientNameHeader)
				container.appendChild(clientName)
				container.appendChild(projectNameHeader)
				container.appendChild(projectName)
				container.appendChild(projectIDHeader)
				container.appendChild(projectID)
				container.appendChild(statusHeader)
				container.appendChild(statusText)
				container.appendChild(dateCreated)
				container.appendChild(dateDue)
				
				list.appendChild(container)
				
			}

		}
		
	}
	else{
		let jobs = userData.jobs
		
		if(jobs.length > 0){
		
			for(var x=0; x<jobs.length; x++){
				let job = jobs[x]
				
				let container = document.createElement("div")
				container.setAttribute("class","updateCloud")
				container.addEventListener("mousedown",()=>{
					container.style["box-shadow"] = "none"
					container.style["border"] = "1px solid black"
				})
				container.addEventListener("mouseup",()=>{
					container.style["box-shadow"] = "0px 0px 7px black"
					container.style["border"] = "none"
				})
				
				container.addEventListener("click", async()=>{
						selectedJob = job
						selectedCurrency = selectedJob.currency
						convertedValue = await getConvertedValue(selectedJob.value)
						swapPages(2)
				})
				
				
				
				let clientName = document.createElement("p")
				clientName.setAttribute("class","infoDetailsOne")
				let clientNameHeader = document.createElement("p")
				clientNameHeader.innerHTML = "Client Name"
				clientNameHeader.setAttribute("class","infoHeaderOne")
				let user = job.ownerId
				clientName.innerHTML = `${await getUserName(user)}`
				
				let projectName = document.createElement("p")
				projectName.setAttribute("class","infoDetailsOne")
				let projectNameHeader = document.createElement("p")
				projectNameHeader.innerHTML = "Name"
				projectNameHeader.setAttribute("class","infoHeaderOne")
				
				projectName.innerHTML = job.name
				
				let projectID = document.createElement("p")
				projectID.setAttribute("class","infoDetailsOne")
				let projectIDHeader = document.createElement("p")
				projectIDHeader.innerHTML = "Project ID"
				projectIDHeader.setAttribute("class","infoHeaderOne")
				
				projectID.innerHTML = job.id
				
				let statusText = document.createElement("p")
				statusText.setAttribute("class","infoDetailsOne")
				let statusHeader = document.createElement("p")
				statusHeader.setAttribute("class","infoHeaderOne")
				
				statusHeader.innerHTML = "Job Status"
				statusText.innerHTML = job.status
				
				let dateCreated = document.createElement("p")
				dateCreated.setAttribute("class","infoDateHeader")
				dateCreated.innerHTML =  "Date Created " + getDateString(job.dateCreated)
				
				let dateDue= document.createElement("p")
				dateDue.setAttribute("class","infoDateHeader")
				if(job.status != "pending payment"){
					
					dateDue.innerHTML = "Date Due " + getDateString(job.dateDue)
				
				}else{

					dateDue.innerHTML = "Make first payment to get due date"
					
				}
				container.appendChild(clientNameHeader)
				container.appendChild(clientName)
				container.appendChild(projectNameHeader)
				container.appendChild(projectName)
				container.appendChild(projectIDHeader)
				container.appendChild(projectID)
				container.appendChild(statusHeader)
				container.appendChild(statusText)
				container.appendChild(dateCreated)
				container.appendChild(dateDue)
				
				list.appendChild(container)
				
			}

		}
	}
}

socket.on("update_reviews_and_overviews",async()=>{
	projectListBuilder()
	reviewListBuilder()
	setUpProjectsSection()
	setUpReviewSection()
})

function setUpProjectsSection(){
	setProjectSectionHeaders()
	projectListBuilder()
}

//provideFeedBack 
let provideFeedBack = document.getElementById("provideFeedBack")
let fdbackUpdateId = document.getElementById("fdbackUpdateId")
let screenshotsDsp = document.getElementById("screenshotsDsp")
let screenshotsDelete = document.getElementById("screenshotsDelete")
let screenshotsIns = document.getElementById("screenshotsIns")
let messageInputfdback = document.getElementById("messageInputfdback")
let screenshotSelect = document.getElementById("selectSecreenImage")
let sendFeedBack = document.getElementById("sendFeedBack")

function setUpFeedbackSection(){
	screenshotsDelete.style.display="none"
	screenshots.length = 0
	screenshotsDsp.innerHTML = `Screenshots (${screenshots.length})`
	fdbackUpdateId.innerHTML = selectedJob.id
}

function setUpUpdateSection(){
	let subject = document.getElementById("prjectUpdateID")
	subject.innerHTML = selectedJob.id
}

screenshotsDelete.style.display="none"

const setScreenshotsHeader = ()=>{
	screenshotsDsp.innerHTML = `Screenshots (${screenshots.length})`
	if(screenshots.length == 0){
		screenshotsDelete.style.display="none"
	}else{
		screenshotsDelete.style.display="block"
	}
}

screenshotsDelete.addEventListener("click",()=>{
	if(screenshots.length > 0){
		let index = screenshots.length-1
		screenshots.splice(index,1)
	}
	setScreenshotsHeader()
})

let stage = 0
let inputx;
inputx = document.createElement("input")
inputx.setAttribute("type","file")
inputx.setAttribute("accept",".jpg,.jpeg,.png,.JPEG")
screenshotsIns.style.display = "none"
screenshotSelect.addEventListener("click",()=>{
	
	if(stage == 0){
		
		inputx.click()
		stage = 1
		screenshotsIns.style.display = "block"
		
	}else{
		if(inputx.files[0] != null){
			screenshots.push(inputx.files[0])
			inputx.files.length = 0 
			screenshotsIns.style.display = "none"
			setScreenshotsHeader()
			stage = 0
		}
	}
	
})

sendFeedBack.addEventListener("click", async()=>{
	
	openLoadingWindow()
	
	let status = false 
	
	let track = 0
	
	selectedFeedback.message = messageInputfdback.value
	selectedFeedback.date = time
	
	if(messageInputfdback.value != null && messageInputfdback.value != ""){
	
		socket.emit("set_job_id",{
			"jobId":selectedJob.id,
			"userId":userData.id
		})
		for(var x=0; x<screenshots.length; x++){
			try{
				let file = screenshots[x]
				let newForm = new FormData()
				newForm.append("file", file)
				
				let sendData = await fetch("/upload-screenshot/"+userData.id,{
					"method":"POST",
					"body": newForm
				});
				
				let response = await sendData.json()
				
				if(response.status == true){
					selectedFeedback.screenshots.push(response.id)
					track = track+1
				}
			}catch{
				selectedFeedback.unfinishedQueue.push(screenshots[x])
			}
		}
		
		if(track == screenshots.length){
			status = true
		}
		
		//upload data
		
		const uploadFile = async()=>{
			
			let req = await fetch("/add-user-feedback",{
				"method":"POST",
				"body":JSON.stringify({
					"data":selectedFeedback,
					"userId": userData.id,
					"jobId": selectedJob.id
				}),
				"headers":{"Content-Type":"application/json"}
			})
			let res = await req.json()
			
			let statusx = res.status
			
			return statusx
			
		}
		
		if(status == false){
			
			if(await uploadFile() == true){
				socket.emit("jobs_updated")
				swapPages(2)
				alert("Your feedback has been sent.Your unfinished uploads will be uploaded later")
			}else{
				alert("Something went wrong. Please check your internet connection")
			}
			
		}else{
			if(await uploadFile() == true){
				socket.emit("jobs_updated")
				swapPages(2)
				alert("Your feedback has been sent.")
			}else{
				alert("Something went wrong. Please check your internet connection")
			}
		}
	
	}else{
		alert("Cannot send empty message. Please type in a message to continue")
	}
	
})

//provideUpdate
let provideUpdate = document.getElementById("provideUpdate")
let selectZip = document.getElementById("selectFiles")
let selectZipInput = document.getElementById("fileInput")
let updateMessage = document.getElementById("messageInputUpdate")
let sendUpdate = document.getElementById("sendUpdate")
let projectIDHeaderx = document.getElementById("projIDheader")
let screenshotsIns2 = document.getElementById("screenshotsIns2")
let fileNameDsp = document.getElementById("fileNameDsp")

fileNameDsp.style.display = "none"

let stagex = 0

let zipFiles = []

selectZip.addEventListener("click",()=>{
	if(stagex == 0){
		screenshotsIns2.style.display = "block"
		selectZipInput.click()
		stagex = 1
	}else{
		if(zipFiles.length < 1){
			screenshotsIns2.style.display = "block"
			if(selectZipInput.files[0] != null){
				zipFiles.push(selectZipInput.files[0])
				stagex = 0
				fileNameDsp.style.display = "block"
				fileNameDsp.innerHTML = zipFiles[0].name
			}else{
				alert("Please select a file to continue")
			}
		}else{
			alert("You cannot add more than one zip file")
		}
	}
});

const checkUpdateFields = async()=>{
	
	openLoadingWindow()

	let output = false
	if(updateMessage.value != "" && updateMessage.value != null){
		
		selectedUpdate.message = updateMessage.value
		selectedUpdate.date = time
		
		let proceed = false
		
		if(selectZipInput.files[0] != null){
			
			let newForm = new FormData()
			
			newForm.append("file", selectZipInput.files[0])
			
			socket.emit("set_media",{
				"ownerId": selectedJob.ownerId,
				"jobId": selectedJob.id,
				"userId": userData.id
			})
			
			let sendData = await fetch("/upload-zip/"+userData.id,{
				"method":"POST",
				"body": newForm
			});
			
			let response = await sendData.json()
			
			if(response.status == true){
				proceed = true
			}
		}
		
		if(selectZipInput.files[0] != null){
			
			if(proceed == true){
				let req = await fetch("/add-user-update",{
					"method":"POST",
					"body":JSON.stringify({
						update : selectedUpdate,
						userId : userData.id,
						jobId : selectedJob.id,
						job: selectedJob
					}),
					"headers":{"Content-Type":"application/json"}
				})
				let res = await req.json()
				
				let status = res.status 
				
				if(status == "success"){
					
					//update selected job 
					let user = await getUserData(selectedJob.ownerId)
					let jobs = user.jobs 
					let job = jobs.find((jobs)=>{
						return jobs.id === selectedJob.id
					})
					
					selectedJob = job
					
					swapPages(3)
					socket.emit("jobs_updated")
					
					alert("Your update has been sent successfully")
				}else{
					alert("Something went wrong while uploading files. Please try again later")
				}
				
			}else{
				alert("Something went wrong while uploading files. Please try again later.")
			}
			
		}else{
			let req = await fetch("/add-user-update",{
					"method":"POST",
					"body":JSON.stringify({
						update : selectedUpdate,
						userId : userData.id,
						jobId : selectedJob.id
					})
				})
				let res = await req.json()
				
				let status = req.status 
				
				if(status === "success"){
					
					//update selected job 
					let user = await getUserData(selectedJob.ownerId)
					let jobs = user.jobs 
					socket.emit("jobs_updated")
					
					alert("Your update has been sent successfully")
				}else{
					alert("Something went wrong while uploading files. Please try again later")
				}
		}
		
		
		
	}else{
		alert("Update message field cannot be empty")
	}
	return output 
}

sendUpdate.addEventListener("click",()=>{
	checkUpdateFields()
})

//paymentSection 
let paymentSection = document.getElementById("payment-section")
let payInFullSwitch = document.getElementById("payInFullSwitch")

let amountDue = document.getElementById("amountDue")
let totalPaid = document.getElementById("totalAmountPaid")
let installmentAmount = document.getElementById("installmentAmount")

let openPaypalBtn = document.getElementById("openPaypalBtn")

openPaypalBtn.addEventListener("click",()=>{
	if(convertedValue != 0){
		openPaypalProceed()
	}
})

/*Forgot Password Section*/

let passwordConsoleController = {
	"mode":"Forgot Password"
};


let forgotPasswordSection = document.getElementById("forgotPasswordSection")
//important page elements
let generalInput = document.getElementById("forgotPasswordAnswerInput")
let generalPasswordInput = document.getElementById("forgotPasswordAnswerInput2")
let instruction = document.getElementById("forgotPassword_header")

let verifyBtn = document.getElementById("verifyEmail_forgotPassword");

async function ChangePassword(userData,password){
	
	var output = false
	
	try{
		
		let getData = await fetch("/change-user-password",{
			"method":"POST",
			"body":JSON.stringify({
				"password":password,
				"userId":userData.userId
				}),
			"headers":{"Content-Type":"application/json"}
		});
		
		let response = await getData.json()
		
		console.log(response)
		
		if(response.status == true){
			
			output = true
			userData.password = password
			
		}
		
	}catch{
		
		alert("Something went wrong. Please check your internet connection or try again later.")
	
		setTimeout(()=>{
			closeLoadingWindow()
		},300)
		
	}
	
	return output
	
};

let userSecretQuestion;
let userSecretQuestionAnswer;
let transferEmail;

async function getUserSQ(address){
	
	var output = false
	
	try{
		
		let getData = await fetch("/get-user-sq",{
			"method":"POST",
			"body":JSON.stringify({"email":address}),
			"headers":{"Content-Type":"application/json"}
		})
		
		let response = await getData.json()
		
	
		if(response.status == true){
			output = true; 
			userSecretQuestion = response.q
			userSecretQuestionAnswer = response.a
		}

	}catch{
		alert("Something went wrong. Please check your internet connection or try again later.")
	}
	
	return output
	
}

async function ChangePassword2(password){
	
	var output = false
	
	try{
		
		
		let getData = await fetch("/change-user-password-by-email",{
			"method":"POST",
			"body":JSON.stringify({
				"password":password,
				"email":transferEmail
				}),
			"headers":{"Content-Type":"application/json"}
		});
		
		let response = await getData.json()
		
		console.log(response)
		
		if(response.status == true){
			
			output = true
			userData = response.data
			socket.emit("user-login",userData)
			transferPlans = userData.subscriptionPlans
					
			for(var i=0; i<transferPlans.length; i++){
						
				let subscription = transferPlans[i]
						
				if(subscription.active == true){
					activeSubs = true
					editedSubscription = subscription
				}
					
			};
			output = true
			alreadyLogged = true
			priviledges()
					
			if(activeSubs == true){
				changeSubMachineMode()
			}
		}
		
	}catch{
		
		alert("Something went wrong. Please check your internet connection or try again later.")
	
		setTimeout(()=>{
			closeLoadingWindow()
		},300)
		
	}

	return output
	
};

verifyBtn.addEventListener("click", async()=>{
	
	openLoadingWindow()
	
	if(passwordConsoleController.mode === "Forgot Password"){
		
		
		if(stage == 1){
		
			let checkForUser = await getUserSQ(generalInput.value)
		
			if(checkForUser == true){
				
				transferEmail = generalInput.value
				userData = checkForUser;
				
				//change data on page 
				
				instruction.innerHTML = userSecretQuestion;
				
				generalInput.setAttribute("placeholder","Type in your answer here")
				stage++
				
				closeLoadingWindow()
				displayDialogBackground(false)
				
			}else{
				
				alert("Sorry this user does not exist. Please type in a valid email address and try again")
				setTimeout(closeLoadingWindow,1000)
				
			}
	
		}else if(stage == 2){
			
			let answer = generalInput.value.toLowerCase()
			
			if(answer === userSecretQuestionAnswer.toLowerCase()){
				
				stage++
				instruction.innerHTML = "Create a new password"
				generalInput.setAttribute("placeholder","Type in your new password here")
				generalPasswordInput.style.display = "none";
				
				//make it visible
				
					generalPasswordInput.style.display = "block"
				setTimeout(()=>{
					
					generalPasswordInput.style.opacity = "1"
					
				},100)
				
				closeLoadingWindow()
				displayDialogBackground(false)
				
			}else{
				alert("Invalid secret question answer. Please type in the correct answer and try again")
				setTimeout(()=>{
					closeLoadingWindow()
					displayDialogBackground(false)
				},1000)
				
			}
			
		}else if(stage == 3){
			
			if(generalInput.value === generalPasswordInput.value){
				
				let regex = /[A-Za-z0-9]/
				
				let test = regex.test(generalInput.value)
				
				if(test == true && generalInput.value.length > 8){
					
					let changePasswords = await ChangePassword2(generalInput.value)
					
					if(changePasswords == true){
						
						//reset stage
						stage = 1
						alert("Your password has been successfully changed")
						
						setTimeout(()=>{swapPages(3)},300)
						
						
					}else{
						
						alert("Something went wrong. Please try again later.")
						
					}
					
				}else{
					alert("Passwords can only contain atleast 8 characters which include letters, atleat 1 number and/or these special characters: _-*")
				}
				
				
			}else{
				alert("Passwords do not match")
			}
			
		}else{
			
		}
		
	}
	
})


// cloud elements 
let psName = document.getElementById("psName")
let psClientName = document.getElementById("psClientName")
let psPID = document.getElementById("psPID")
let psDateCreated = document.getElementById("psDateCreated")
let psDateDue = document.getElementById("psDateDue")



async function setPaymentHeaders(switchx){
	let oldValue = selectedJob.value
    if(switchx == false){
        let installment = getFirstInstallment(convertedValue)
        paymentValue = installment
        installmentAmount.innerHTML = `${installment} ${selectedCurrency}`
        amountDue.innerHTML = `${await getAmountDue()} ${selectedCurrency}`
        totalPaid.innerHTML = `${await getTotalPaid()} ${selectedCurrency}`
		selectedJob.value = oldValue
    }else{
        let installment = getFirstInstallment(convertedValue)

        installmentAmount.innerHTML = `${installment} ${selectedCurrency}`
        paymentValue = installment

        amountDue.innerHTML = `${await getAmountDue()} ${selectedCurrency}`
        totalPaid.innerHTML = `${await getTotalPaid()} ${selectedCurrency}`
		selectedJob.value = oldValue * 0.97
    }
    
    if(selectedJob){
        psDateDue.innerHTML = "Date Due " + getDateString(selectedJob.dateDue)
        psDateCreated.innerHTML = "Date Created " +getDateString(selectedJob.dateCreated)
        psPID.innerHTML = selectedJob.id
        psClientName.innerHTML = `${userData.firstName} ${userData.lastName}`
        psName.innerHTML = selectedJob.name
    }else{
        psDateDue.innerHTML = "Date Due " + getDateString(calculateDueDate())
        psDateCreated.innerHTML = "Date Created " +getDateString(time)
        psPID.innerHTML = jobID
        psClientName.innerHTML = `${userData.firstName} ${userData.lastName}`
        psName.innerHTML = selectedJob.name
    }
}

function setUpPaymentSection(){
	setPaymentHeaders(payInFullSwitch.checked)
}

payInFullSwitch.addEventListener("click",()=>{
	if(selectedJob.installmentPaid == false){
		payInFull = payInFullSwitch.checked
		setPaymentHeaders(payInFull)
	}else{
		payInFullSwitch.checked = false
		alert("Sorry. This feature is only available at first payment")
	}
})
/*Set defaults*/
headerSect.style.opacity = "0"
backgroundPic.style.opacity = "0"
startPage.style.display = "none"
startPage.style.opacity = "0"
welcomeScreen.style.display = "block"
welcomeScreen.style.opacity = "0"
mainDsp.style.display = "none"
mainDsp.style.opacity = "0"

//external dialog Elements

let dialogBackground = document.getElementById("dialogBackground")
let alertDialog = document.getElementById("alertDialogBox")
let promptDialog = document.getElementById("promptDialog")
let alertText = document.getElementById("alertMessage")
let promptText = document.getElementById("promptText")
let listDialog = document.getElementById("listDialogBox")
let listMessage = document.getElementById("selectMessage")
let dialogList = document.getElementById("generalListing")
let alertCloseBtn = document.getElementById("closeAlertBtn")
let promptYesBtn = document.getElementById("yesBtn")
let promptNoBtn = document.getElementById("noBtn");
let closeGeneral = document.getElementById("closeBtn")
let paypalInitWindow = document.getElementById("paypalProceedWindow");
let messaging_window = document.getElementById("messagingWindow")
let upload_window = document.getElementById("uplaodWindow")

let paypalAgreed = false

//dialog switches 

let listDialogActive = false
let alertDialogActive = false
let promptDialogActive = false
let paypalProceedActive = false
let uploadActive = false

//basic visual alert functions


//open paypal proceed window 

function openPaypalProceed(){
	
	displayDialogBackground(true)
	
	setTimeout(()=>{
		
		paypalInitWindow.style["margin-top"] = "12%"
	
		setTimeout(()=>{
			paypalInitWindow.style.opacity = "1"
			
		
			
		},200)
		
		paypalProceedActive = true
		
	},200)
	
	
	
	
	
}

//loading window controllers

let loadingWindow = document.getElementById("loadingWindow")

let loaderActive = false


function openLoadingWindow(){
	
	loaderActive = true
	//open dialog background
	displayDialogBackground(true)
	
	//make loading window visible
	
	loadingWindow.style["margin-top"] = "1000px"
	loadingWindow.style.display = "block";
	
	setTimeout(()=>{
		//animate
		
		loadingWindow.style["margin-top"] = "15%"
		setTimeout(()=>{
			
			loadingWindow.style["opacity"] = "1"
			
		},90)
	},50)
	
};

function closeLoadingWindow(){
	loaderActive = false
	//open dialog background
	displayDialogBackground(true)
	
	//make loading window visible
	
	loadingWindow.style["margin-top"] = "1000px"
	
	
	setTimeout(()=>{
		//animate
		loadingWindow.style["opacity"] = "1"
		setTimeout(()=>{
			
			loadingWindow.style["display"] = "none"

			
			
		},100)
	},60)
	
};


function closePaypalProceed(){
	
	paypalInitWindow.style.opacity = "0"
	
	setTimeout(()=>{
		
		paypalInitWindow.style["margin-top"] = "1000px"
			
	},100)
	
	paypalProceedActive = false
	
	
	
	
	
}

function displayDialogBackground(dsp){
	
	if(dsp == true){
		
		dialogBackground.style.display = "block"

		setTimeout(()=>{
			
			dialogBackground.style.opacity = "1"
			
		},50)
		
	}else{
		
		dialogBackground.style.opacity = "0"
		
		setTimeout(()=>{
			
			dialogBackground.style.display = "none"
			
		},50)
		
	}
	
}

let alertMessageQueue = []

function alert(msg){
	
	alertMessageQueue.splice(0,0,msg)
	
	alertText.innerHTML = alertMessageQueue[0]
	
	closeAllDialogs()
	
	setTimeout(()=>{
		
		displayDialogBackground(true)
	
		setTimeout(()=>{
			
			alertDialog.style["margin-top"] = "12%"
			
			setTimeout(()=>{
				alertDialog.style.opacity = "1"
				setTimeout(()=>{alertDialogActive = true},30)
			},200)
			
		},400)
		
	},700)
	
	
	
}

function closePromptWindow(){
	
	setTimeout(()=>{
		
		promptDialog.style["margin-top"] = "200%"
			
			setTimeout(()=>{
				promptDialog.style.opacity = "0"
				
				setTimeout(()=>{
					
					promptDialogActive = false
					
					setTimeout(()=>{
					
						displayDialogBackground(false)
					
					},120)
					
				},50)
				
		},200)	
			
	},50)	
		
}

function prompt(msg,functionRun){
	
	promptText.innerHTML = msg
	
	setTimeout(()=>{
		
		displayDialogBackground(true)
	
		setTimeout(()=>{
			
			promptDialog.style["margin-top"] = "12%"
			
			setTimeout(()=>{
				promptDialog.style.opacity = "1"
			},200)
			
		},400)
		
	},50)
	
	promptDialogActive = true
	
	promptYesBtn.addEventListener("click" , ()=>{
		
		closePromptWindow()
		
		setTimeout(()=>{
			functionRun()
		},500)
		
	})
	promptNoBtn.addEventListener("click",()=>{
		closePromptWindow()
	})
	
}

function closeAlertWindow(){
	
	if(alertMessageQueue.length < 2 ){
		
		alertMessageQueue.splice(0,1)
		
		setTimeout(()=>{
		
			alertDialog.style["margin-top"] = "1000px"
			
			setTimeout(()=>{
				alertDialog.style.opacity = "0"
				
				setTimeout(()=>{
					
					alertDialogActive = false
					
				},50)
				
			},200)
			
		},50)
		
	}else{
		
		//delete displayed message
		
		alertMessageQueue.splice(0,1)
		
		changeText(alertMessageQueue[0],alertText)
		
	}
	
	
	
}

alertCloseBtn.addEventListener("click", ()=>{
	
	closeAlertWindow()
	if(alertMessageQueue.length == 0){
		
		if(
			listDialogActive == false &&
			promptDialogActive == false &&
			paypalProceedActive == false &&
			uploadActive == false
		){
			
			displayDialogBackground(false)
		
		}
		
	}
	
})

function populateList(){
	
	let array;
	
	if(listDialogType === "Currency"){
		array = currencyArray
	}else{
		
		array = countryArray
		
	}
	
	for(var i=0; i<array.length; i++){
		
		let item = document.createElement("li");
		
		item.style.opacity = 1;
		
		//set params
		
		item.setAttribute("class", "selectListItem")
		item.innerHTML = array[i]
		let c = currencyArray[i]
		selectedCurrency = c
        selectedJob.currency = c
		
		
		item.addEventListener("click", ()=>{
								
								
								countrySelectorText.innerHTML = item.innerHTML
								currencyText.innerHTML = c
								priceCalculator()
								setPaymentHeaders(payInFull)
								setTimeout(closeAllDialogs,300)
								
		})
		
		dialogList.appendChild(item)
		
		
	}
	
	
	
}

//list dialog operator
let listDialogType = "Currency"
//currency array
let currencyArray = [
	"AUD",
                "AFN",
                "ALL",
                "DZD",
                "AOA",
                "ARS",
                "AMD",
                "AWG",
                "AZN",
                "BSD",
                "BHD",
                "BDT",
                "BBD",
                "BYR",
                "BZD",
                "BMD",
                "BTN",
                "BOB",
                "BAM",
                "BWP",
                "BRL",
                "BND",
                "BGN",
                "BIF",
                "XOF",
                "XAF",
                "XPF",
                "KHR",
                "CAD",
                "CVE",
                "KYD",
                "CLP",
                "CNY",
                "COP",
                "KMF",
                "CDF",
                "CRC",
                "HRK",
                "CUC",
                "CUP",
                "CZK",
                "DKK",
                "DJF",
                "DOP",
                "XCD",
                "EGP",
                "SVC",
                "ETB",
                "FKP",
                "FJD",
                "GMD",
                "GEL",
                "GHS",
                "GIP",
                "GBP",
                "GTQ",
                "GNF",
                "GYD",
                "HTG",
                "HNL",
                "HKD",
                "HUF",
                "ISK",
                "INR",
                "IDR",
                "IRR",
                "IQD",
                "ILS",
                "JMD",
                "JPY",
                "JOD",
                "KZT",
                "KES",
                "KWD",
                "KGS",
                "LAK",
                "LBP",
                "LSL",
                "LRD",
                "LYD",
                "MOP",
                "MKD",
                "MGA",
                "MWK",
                "MYR",
                "MVR",
                "MRO",
                "MUR",
                "MXN",
                "MDL",
                "MNT",
                "MAD",
                "MZN",
                "MMK",
                "ANG",
                "NAD",
                "NPR",
                "NZD",
                "NIO",
                "NGN",
                "KPW",
                "NOK",
                "OMR",
                "PKR",
                "PAB",
                "PGK",
                "PYG",
                "PEN",
                "PHP",
                "PLN",
                "QAR",
                "RON",
                "RUB",
                "RWF",
                "WST",
                "STD",
                "SAR",
                "RSD",
                "SCR",
                "SLL",
                "SGD",
                "SBD",
                "SOS",
                "ZAR",
                "KRW",
                "LKR",
                "SHP",
                "SDG",
                "SRD",
                "SZL",
                "SEK",
                "CHF",
                "SYP",
                "TWD",
                "TZS",
                "THB",
                "TOP",
                "TTD",
                "TND",
                "TRY",
                "TMM",
                "USD",
                "UGX",
                "UAH",
                "UYU",
                "AED",
                "VUV",
                "VEB",
                "VND",
                "YER",
                "ZMW",
                "ZWD"
]

let countryArray = [
		"Australia",
        "Great Britain",
        "Euro",
        "Japan",
        "Switzerland",
        "USA",
        "Afghanistan",
        "Albania",
        "Algeria",
        "Angola",
        "Argentina",
        "Armenia",
        "Aruba",
        "Australia",
        "Austria",
        "Belgium",
        "Azerbaijan",
        "Bahamas",
        "Bahrain",
        "Bangladesh",
        "Barbados",
        "Belarus",
        "Belize",
        "Bermuda",
        "Bhutan",
        "Bolivia",
        "Bosnia",
        "BotswanaP",
        "Brazil",
        "Brunei",
        "Bulgaria",
        "Burundi",
        "CFA",
        "Cambodia",
        "Canada",
        "Cape",
        "Cayman",
        "Chili",
        "China",
        "Colombia",
        "Comoros",
        "Congo",
        "Costa",
        "Croatia",
        "Cuba",
        "Cuba",
        "Cyprus",
        "Czech",
        "Denmark",
        "Djibouti",
        "Dominican Republich",
        "East Caribbean",
        "Egypt",
        "El Salvador",
        "Estonia Kroon",
        "Ethiopia",
        "Falkland Islands",
        "Finland",
        "Fiji",
        "Gambia",
        "Georgia",
        "Germany",
        "Ghana",
        "Gibraltar",
        "Greece",
        "Guatemala",
        "Guinea",
        "Guyana",
        "Haiti",
        "Honduras",
        "Hong Kong",
        "Hungary",
        "Iceland",
        "India",
        "Indonesia",
        "Iran",
        "Iraq",
        "Ireland",
        "Israel",
        "Italy",
        "Jamaica",
        "Japan",
        "Jordan",
        "Kazakhstan",
        "Kenya",
        "Kuwait",
        "Kyrgyzstan",
        "Laos",
        "Latvia",
        "Lebanon",
        "Lesotho",
        "Liberia",
        "Libya",
        "Lithuania",
        "Luxembourg",
        "Macau",
        "Macedonia",
        "Malagasy",
        "Malawi",
        "Malaysia",
        "Maldives",
        "Malta",
        "Mauritania",
        "Mauritius",
        "Mexico",
        "Moldova",
        "Mongolia",
        "Morocco",
        "Mozambique",
        "Myanmar",
        "NL Antilles",
        "Namibia",
        "Nepal",
        "Netherlands",
        "New Zealand",
        "Nicaragua",
        "Nigeria",
        "North Korea",
        "Norway",
        "Oman",
        "Pakistan",
        "Panama",
        "Papua",
        "Paraguay",
        "Peru",
        "Philippines",
        "Poland",
        "Portugal",
        "Qatar",
        "Romania",
        "Russia",
        "Rwanda",
        "Samoa",
        "Sao Tome/Principe",
        "Saudi Arabia",
        "Serbia",
        "Seychelles",
        "Sierra Leone",
        "Singapore",
        "Slovakia",
        "Slovenia",
        "Solomon Islands",
        "Somali",
        "South Africa",
        "South Korea",
        "Spain",
        "Sri Lanka",
        "St Helena",
        "Sudan",
        "Suriname",
        "Swaziland",
        "Sweden",
        "Switzerland",
        "Syria",
        "Taiwan",
        "Tanzania",
        "Thailand",
        "Tonga",
        "Trinidad/Tobago",
        "Tunisia",
        "Turkey",
        "Turkmenistan",
        "USA",
        "Uganda",
        "Ukraine",
        "Uruguay",
        "United Arab Emirates",
        "Vanuatu",
        "Venezuela",
        "Vietnam",
        "Yemen",
        "Zambia",
        "Zimbabwe"
]


function openList(){
	
	let type = listDialogType;
	
	listMessage.innerHTML = "Select your currency from the list below"
	
	//bring up view
	
	displayDialogBackground(true)
	
	setTimeout(()=>{
		
		listDialog.style.opacity = "1"
		
		setTimeout(()=>{
			
			listDialog.style["margin-top"] = "12%"
			
			if(type === "Currency"){
				
				listMessage.innerHTML = "Select your currency from the list below"
				populateList()
					
				
			}else if(type === "Country"){
				
				listMessage.innerHTML = "Select your country and currency from the list below"
				populateList()
				
			}
			
		},200)
		
	},50)
	
	listDialogActive = true
	
	
}

function closeList(){
	
	listDialog.style["margin-top"] = "1000px";
	
	setTimeout(()=>{
		
		listDialog.style.opacity = "0"
		listDialogActive = false
		
	},200)
	
}

function closeAllDialogs(){
	
	if(alertDialogActive == true){
		
		closeAlertWindow()
		alertDialogActive = false
		
	}
	
	if(listDialogActive == true){
		
		closeList()
		listDialogActive = false
		
	}
	
	if(paypalProceedActive == true){
		
		closePaypalProceed()
		paypalProceedActive = false
		
	}
	
	if(loaderActive == true){
		
		closeLoadingWindow()
		
	}
	
	setTimeout(()=>{
		displayDialogBackground(false)
	},300)
	
	
	
	
	
}

closeGeneral.addEventListener("click", ()=>{
	
	closeAllDialogs()
	
})



const openingSequence = ()=>{
    setTimeout(()=>{
        
        headerSect.style.opacity = "1"
        setTimeout(()=>{
            
            welcomeScreen.style.opacity = "1"
            
            setTimeout(()=>{
                welcomeScreen.style.opacity = "0"
				
                setTimeout(()=>{
                        welcomeScreen.style.display = "none"
						setTimeout(()=>{
							backgroundPic.style.opacity = "1"
							setTimeout(()=>{
								startPage.style.display = "block"
								setTimeout(()=>{
									startPage.style.opacity = "1"
								},70)
							},700)
						},700)
                },70)
                
            },3000)
            
        },1000)
        
    },1000)
}

openingSequence()

let btnsClassOne = document.getElementsByClassName("btnClassOne")
let btnsClassTwo = document.getElementsByClassName("btnClassTwo")
let btnsClassThree = document.getElementsByClassName("btnClassThree")

function sortBtnsOne(){
	
	for(var i=0; i<btnsClassOne.length; i++){
		let it = btnsClassOne[i]
		
		it.addEventListener("mousedown",()=>{
			it.style.color = "white"
			it.style.background = "black"
		})
		it.addEventListener("mouseup",()=>{
			it.style.color = "black"
			it.style.background = "white"
		})
	}
	
}

sortBtnsOne()

function sortBtnsTwo(){
	
	for(var i=0; i<btnsClassTwo.length; i++){
		let it = btnsClassTwo[i]
		
		it.addEventListener("mousedown",()=>{
			it.style.color = "white"
			it.style.background = "black"
		})
		it.addEventListener("mouseup",()=>{
			it.style.color = "black"
			it.style.background = "none"
		})
	}
	
}

sortBtnsThree()

function sortBtnsThree(){
	
	for(var i=0; i<btnsClassThree.length; i++){
		let it = btnsClassThree[i]
		
		it.addEventListener("mousedown",()=>{
			it.style.color = "black"
			it.style.background = "none"
		})
		it.addEventListener("mouseup",()=>{
			it.style.color = "white"
			it.style.background = "black"
		})
	}
	
}

sortBtnsThree()

let menuBtnMain = document.getElementById("menuBtn");
let menuShape = document.getElementById("menu-shape");
let menuMainList = document.getElementById("menu-list")

menuShape.style.display="none"

let menuDsp = false

menuBtnMain.addEventListener("click",()=>{
	
	if(mainSwapped == true){
		if(menuDsp == false){
			menuBtnMain.src="Images/menuactive.png"
			menuShape.style.display="block"
			setTimeout(()=>{
				menuShape.style.height = "563px"
				menuMainList.style.display="block"
				menuDsp = true
				setTimeout(()=>{
					menuMainList.style.opacity = "1"
				},120)
			},70)
			
		}else{
			menuMainList.style.opacity = "0"
			
			setTimeout(()=>{
				menuBtnMain.src="Images/menuinactive.png"
				menuShape.style.height = "0px"
				setTimeout(()=>{
					menuShape.style.display="none"
					menuMainList.style.display="none"
					menuDsp = false
				},200)
				
			},120)
			
		}
	}else{
		alert("Please click start button first")
	}
	
	
	
})

let pages = {
	"previousPage": null,
	"currentPage": null
}

const swapPages = async(index)=>{
	
	mainDspShape.style["overflow-x"]="none"
	
	let current;
	
	let last = pages.previousPage
	
	if(last != null){
		
		last.style.opacity = "0"
		setTimeout(()=>{
			last.style.display = "none"
			
			function evalWidth(){
				let output = false
				
				if(transferWidth > 980){
					if(index == 0){
						output = 65
					}
					if(index == 1){
						output = 65
					}
					if(index == 2){
						output = 80
					}
					if(index == 3){
						output = 80
					}
					if(index == 4){
						output = 80
					}
					if(index == 5){
						output = 80
					}
					if(index == 6){
						output = 80
					}
					if(index == 7){
						output = 60
					}
					if(index == 8){
						output = 60
					}
				}else{
					output = 90
				}
				
				return output
			}
			
			mainDspShape.style.width = `${evalWidth()}%`
			mainDspShape.style["margin-left"] = `${((100-evalWidth())/2)-1}%`
			
			setTimeout(()=>{
				pages.previousPage = pages.currentPage
				let last = pages.previousPage
				if(last){last.style.opacity = "0"}
				setTimeout(()=>{
					if(last){last.style.display = "none"}
					if(index == 0){
					
						pages.currentPage = userLogin
						current = pages.currentPage
						adminSwitch.checked = false
						
					}
					if(index == 1){
						pages.currentPage = addNewCustomerSection
						current = pages.currentPage
						setUpAddClientSelection()
					}
					if(index == 2){
						pages.currentPage = reviewSection
						current = pages.currentPage
						setUpReviewSection()
					}
					if(index == 3){
						pages.currentPage = projectsOverview
						current = pages.currentPage
						setUpProjectsSection()
					}
					if(index == 4){
						pages.currentPage = provideFeedBack
						current = pages.currentPage
						setUpFeedbackSection()
					}
					if(index == 5){
						pages.currentPage = provideUpdate
						current = pages.currentPage
						setUpUpdateSection()
					}
					if(index == 6){
						pages.currentPage = paymentSection
						current = pages.currentPage
						setUpPaymentSection()
					}
					if(index == 7){
						pages.currentPage = forgotPasswordSection
						current = pages.currentPage
						generalInput.setAttribute("placeholder", "Type in your email address here");
						generalPasswordInput.style.display = "none"
						instruction.innerHTML = "Type in your email address to continue"
					}
					if(index == 8){
						pages.currentPage = addAdminSection
						current = pages.currentPage
					}
					
					current.style.display = "block"
					setTimeout(()=>{current.style.opacity = "1"},30)
				},30)
				
				
			},300)
			
		},300)
		
	}else{
		function evalWidth(){
			let output = false
			
			if(transferWidth > 980){
				if(index == 0){
					output = 65
				}
				if(index == 1){
					output = 65
				}
				if(index == 2){
					output = 80
				}
				if(index == 3){
					output = 80
				}
				if(index == 4){
					output = 80
				}
				if(index == 5){
					output = 80
				}
				if(index == 6){
					output = 80
				}
				if(index == 7){
					output = 60
				}
				if(index == 8){
						output = 60
					}
			}else{
				output = 90
			}
			
			return output
		}
		
		mainDspShape.style.width = `${evalWidth()}%`
		mainDspShape.style["margin-left"] = `${((100-evalWidth())/2)-1}%`
		
		setTimeout(()=>{
				pages.previousPage = pages.currentPage
				let last = pages.previousPage
				if(last){last.style.opacity = "0"}
				setTimeout(()=>{
					if(last){last.style.display = "none"}
					if(index == 0){
					
						pages.currentPage = userLogin
						current = pages.currentPage
						
					}
					if(index == 1){
						pages.currentPage = addNewCustomerSection
						current = pages.currentPage
						setUpAddClientSelection()
					}
					if(index == 2){
						pages.currentPage = reviewSection
						current = pages.currentPage
						setUpReviewSection()
					}
					if(index == 3){
						pages.currentPage = projectsOverview
						current = pages.currentPage
						setUpProjectsSection()
					}
					if(index == 4){
						pages.currentPage = provideFeedBack
						current = pages.currentPage
						setUpFeedbackSection()
					}
					if(index == 5){
						pages.currentPage = provideUpdate
						current = pages.currentPage
						setUpdateSection()
					}
					if(index == 6){
						pages.currentPage = paymentSection
						current = pages.currentPage
						setUpPaymentSection()
					}
					if(index == 7){
						pages.currentPage = forgotPasswordSection
						current = pages.currentPage
						generalInput.setAttribute("placeholder", "Type in your email address here");
						generalPasswordInput.style.display = "none"
						instruction.innerHTML = "Type in your email address to continue"
					}
					if(index == 8){
						pages.currentPage = addAdminSection
						current = pages.currentPage
					}
					current.style.display = "block"
					setTimeout(()=>{current.style.opacity = "1"},30)
				},30)
				
				
			},300)
			
	}
	
	
	
	
	
}

let mainSwapped = false

const swapToMain = ()=>{
    setTimeout(()=>{

        startPage.style.opacity = "0"
		backgroundPic.style.opacity = "0"
        
        setTimeout(()=>{

            startPage.style.display = "none"
			setTimeout(()=>{

				mainDsp.style.display = "block"
				mainDspShape.style.display = "block"
				mainDspShape.style.opacity = "0"
				setTimeout(()=>{

							mainDsp.style.opacity = "1"
							
							setTimeout(()=>{
								mainDspShape.style.opacity = "1"
								setTimeout(()=>{
									swapPages(1)
									setTimeout(()=>{
										mainSwapped = true
									},120)
								},300)
							},300)

				},30)

			},100)
        },30)
        

    },700)
}

startBtn.addEventListener("click",swapToMain)

function CheckLoginFields(){
    let output = false 
    
    if(
        userIdInput.value != "" && 
        userIdInput.value != null && 
        userPasswordInput.value != "" && 
        userPasswordInput.value != null
    ){
        output = true
    }else{
        alert("Please type in a valid user ID / email address to login")
    }
    
    return output
}

function LogOutUser(){
	
	socket.emit("disconnect manually",{"userId":userData.id})
	userData = null
	setPriviledges();
	location.reload()
	
};

async function loginUser(){
    
    openLoadingWindow()
    
    let check = CheckLoginFields()
	
	let userId = userIdInput.value
	let password = userPasswordInput.value
    
    if(check == true){
    
		if(userModes.user == true){
			try{
				let req = await fetch("/login-client",{
					"method" : "POST",
					"body":JSON.stringify({
						"userId": userId,
						"password": password
					}),
					"headers":{"Content-Type":"application/json"}
				}) 
				
				let res = await req.json()
				
				console.log(res)
				
				let status = res.status 
				
				if( status === "non-existent" ){
					alert("Sorry. This user does not exist")
				}
				if( status === "wrong-password" ){
					alert("Credentials are wrong.Please input correct email/User ID or password")
				}
				if(status == "server-error"){
					alert("Something went wrong with our server. Please try again later")
				}
				if( status === "success" ){
					
					userData = res.data
					
					if(res.type === "user"){
						userModes.user = true
						userModes.admin = false
					}else{
						userModes.user = false
						userModes.admin = true
					}
					
					socket.emit("user-login",{"userId":userData.id})
						
					swapPages(3)
					alert(`Welcome ${userData.firstName} ${userData.lastName}`)
					
					setTimeout(()=>{					
						setPriviledges()
					},700)
					
				}
		
			}
			catch{
				alert("Something went wrong. Please check your internet connection settings or try again later.")
			}
		}else{
			try{
				let req = await fetch("/login-admin",{
					"method" : "POST",
					"body":JSON.stringify({
						"userId": userId,
						"password": password
					}),
					"headers":{"Content-Type":"application/json"}
				}) 
				
				let res = await req.json()
				
				console.log(res)
				
				let status = res.status 
				
				if( status === "non-existent" ){
					alert("Sorry. This user does not exist")
				}
				if( status === "wrong-password" ){
					alert("Credentials are wrong.Please input correct email/User ID or password")
				}
				if(status == "server-error"){
					alert("Something went wrong with our server. Please try again later")
				}
				if( status === "success" ){
					
					userData = res.data
					
					if(res.type === "user"){
						userModes.user = true
						userModes.admin = false
					}else{
						userModes.user = false
						userModes.admin = true
					}
					
					socket.emit("user-login",{"userId":userData.id})
						
					swapPages(3)
					alert(`Welcome ${userData.firstName} ${userData.lastName}`)
					
					setTimeout(()=>{					
						setPriviledges()
					},700)
					
				}
		
			}
			catch{
				alert("Something went wrong. Please check your internet connection settings or try again later.")
			}
		}
    }
}
        
let newClient = {
            "id": null,
            "firstName":null,
            "lastName": null,
            "password": null,
            "emailAddress":null,
            "jobs":[],
            "payments":[],
            "dateCreated": time
        }

function ProcessClientInputs(){
	
	let output = false
	
	openLoadingWindow()
    
    let xpassword = addPassword.value
    let xemail = emailInput.value
    let xconfirmPassword = addConfirmPassword.value 
    let xfirstName = firstName.value
    let xlastName = lastName.value 
    let xdescription = projectDescription.value 
    let xprojectName = projectName.value
    let xsecrtQstn = sqInput.value
    let xsecrtQstnAnswr = sqaInput.value
	
	console.log(xpassword)
	console.log(xemail)
	console.log(xconfirmPassword)
	console.log(xfirstName)
	console.log(xlastName)
	console.log(xdescription)
	console.log(xprojectName)
	console.log(xsecrtQstn)
	console.log(xsecrtQstnAnswr)
    
    let one = false
    let two = false
    let three = false
    let four = false
    let five = false
    let seven = false
    let eight  = false
    let nine = false
    
    
    let textOnlyRegex = /[A-Za-z]/
    let looseRegex = /[A-Za-z0-9][\/*?-]/
    let emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
	let passwordRegex = /[A-Za-z][0-9]/
    if(
        xpassword != null &&
        xpassword !="" &&
        xconfirmPassword != null &&
        xconfirmPassword != "" &&
        xprojectName != null && 
        xprojectName != "" && 
        xdescription != null && 
        xdescription != "" &&
        xfirstName != null &&
        xfirstName != "" &&
        xlastName != null && 
        xlastName != "" &&
		xemail != null && 
        xemail != ""&&
		xsecrtQstn != null && 
        xsecrtQstn != "" &&
		xsecrtQstnAnswr != null && 
        xsecrtQstnAnswr != "" 
    ){
        
        if(
            xpassword === xconfirmPassword
        ){
            
        
            if(passwordRegex.test(xpassword) == true){
				console.log(xpassword.length)
                if(xpassword.length > 7){
                    one = true
                }
            }
            
            if(textOnlyRegex.test(xprojectName)== true || looseRegex.test(xprojectName)== true){
                five = true
            }
            if(textOnlyRegex.test(xfirstName)== true){
        
                two = true
        
            }
            if(textOnlyRegex.test(xlastName)== true){
        
                three = true
        
            }
            if(looseRegex.test(xdescription)== true || textOnlyRegex.test(xdescription)== true){
                four = true
            }
			
			if(emailRegex.test(xemail) == true){
				seven = true
			}
			
			if(looseRegex.test(xsecrtQstn)== true || textOnlyRegex.test(xsecrtQstn)== true){
				eight = true
			}
			if(looseRegex.test(xsecrtQstnAnswr) == true || textOnlyRegex.test(xsecrtQstn)== true){
				nine = true
			}
            
            //final eval 
            
            if(
                one == true &&
                two == true &&
                three == true &&
                four == true &&
                five == true &&
                eight == true &&
                nine == true &&
				seven == true 
            ){
				if(userData != null){
					selectedJob.name = xprojectName
					selectedJob.ownerId = userData.id
					selectedJob.dateCreated = time
					selectedJob.dateDue = calculateDueDate()
					selectedJob.type = selectedPackage
					selectedJob.description = xdescription
				}else{
					
					selectedJob.name = xprojectName
					selectedJob.dateCreated = time
					selectedJob.dateDue = calculateDueDate()
					selectedJob.type = selectedPackage
					selectedJob.description = xdescription
					
					newClient.firstName = xfirstName
					newClient.lastName = xlastName
					newClient.password = xpassword
					newClient.emailAddress = xemail
					newClient.secretQuestion = xsecrtQstn
					newClient.secretQuestionAnswer= xsecrtQstnAnswr
				}
				
				addConfirmPassword.style["border-bottom"] = "3px solid #376ca8 "
				firstName.style["border-bottom"] = "3px solid #376ca8 "
				lastName.style["border-bottom"] = "3px solid #376ca8 "
				projectName.style["border-bottom"] = "3px solid #376ca8 "
				addPassword.style["border-bottom"] = "3px solid #376ca8 "
				projectDescription.style["border"] = "2px solid black"
				
				
                output = true
            }else{
                if(one == false){
                    alert("Passwords must contain atleast 8 characters including 1 number without special characters")
					addPassword.style["border-bottom"] = "3px solid red"
					addConfirmPassword.style["border-bottom"] = "3px solid red"
                }
                if(two == false){
                    alert("First name input can only contain letters")
					firstName.style["border-bottom"] = "3px solid red"
                }
                if(three == false){
                    alert("Last name input can only contain letters")
					lastName.style["border-bottom"] = "3px solid red"
                }
                if(four == false){
                    alert("Description input can only contain letters , numbers and these special characters: \/*?-")
					projectDescription.style["border"] = "3px solid red"
                }
                if(five == false){
                    alert("Project name input can only contain letters , numbers and these special characters: \/*?-")
					projectName.style["border-bottom"] = "3px solid red"
                }
				if(seven == false){
                    alert("Please type in a valid email address")
					emailInput.style["border-bottom"] = "3px solid red"
                }
				if(eight == false){
                    alert("Secret Question input can only contain letters , numbers and these special characters: \/*?-")
					sqInput.style["border-bottom"] = "3px solid red"
                }
				if(nine == false){
                    alert("Secret Question Answer input can only contain letters , numbers and these special characters: \/*?-")
					sqaInput.style["border-bottom"] = "3px solid red"
                }
            }
            
        }else{
            alert("Passwords do not match")
        }
    
    }else{
        alert("Please fill in all fields with relevant information as required")
    }
	
	return output 
}

async function addClientProcess(){
    try{
        
		if(userData == null){
            let process = ProcessClientInputs()
            if(process == true){
            
                    let search = await fetch("/find-user/"+newClient.emailAddress)
                    let result = await search.json()
                    if(result.status == true){
                        let sendData = await fetch("/register-client",{
                            "method":"POST",
                            "body":JSON.stringify(newClient),
                            "headers":{"Content-Type":"application/json"}
                        })
                        
                        let resx = await sendData.json()
						
                        if(resx.status === "success"){
							
							userData = resx.data
							alert("Your account has been created. Use this user ID to login " + resx.data.id)
                            
							if(payInFull == true){
								selectedJob.value = selectedJob.value - (selectedJob.value * 0.07)
							}
							
							selectedJob.ownerId = userData.id
							
							setTimeout(async()=>{
								let sendData = await fetch("/register-job",{
									"method":"POST",
									"body":JSON.stringify({"newJob":selectedJob,"userId":userData.id }),
									"headers":{"Content-Type":"application/json"}
								})
								
								let resy = await sendData.json()
								
								if(resy.status === "success"){
									
									jobID = resy.jobId
									selectedJob.id = jobID
									userData.jobs.push(selectedJob)
									newPayment.value = paymentValue
									newPayment.date = time
									newPayment.currency = selectedCurrency
									newPayment.firstInstallment = true
									
									
									alert("Project added successfully")
									
									setPriviledges()
									
									swapPages(6)
									
								}else{
									alert("Something went wrong. Please check your internet connection settings or try again later.")
								}
							},1000)
							
                            
                        }
                        else{
							
                            alert("Something went wrong. Please check your internet connection settings or try again later.")
                        }
                        
                    }
                    else{
                        
							alert("Email address already exists. Please use another one")
                        
                    }
                    
                
                
            }
		}else{
					if(
						projectName.value != null && projectDescription.value != "" &&
						projectName.value != "" && projectDescription.value != null
					){
						selectedJob.ownerId = userData.id
						selectedJob.name = projectName.value
						selectedJob.dateCreated = time
						selectedJob.dateDue = calculateDueDate()
						selectedJob.type = selectedPackage
						selectedJob.description = projectDescription.value
						let sendData = await fetch("/register-job",{
                            "method":"POST",
                            "body":JSON.stringify({"newJob":selectedJob,"userId":userData.id} ),
                            "headers":{"Content-Type":"application/json"}
                        })
                        
                        let res = await sendData.json()
                        
                        if(res.status === "success"){
							
							jobID = res.jobId
							selectedJob.id = jobID
							userData.jobs.push(selectedJob)
							newPayment.value = paymentValue
							newPayment.date = time
							newPayment.currency = selectedCurrency
							newPayment.firstInstallment = true
								
							swapPages(6)
                            alert("Project added successfully")
                        }else{
							alert("Something went wrong. Please check your internet connection settings or try again later.")
                        }
						
					}else{
						alert("Please fill all fields with the relevant information.")
					}
        }
    }catch{
		alert("Something went wrong. Please check your internet connection settings or try again later.")
    }
	

}

loginInit.addEventListener("click" , ()=>{
	if(alreadyLogged == false){
		loginUser()
	}
})

addClient.addEventListener("click",()=>{
	if(selector.options[selector.selectedIndex].id != "optionDefault"){
		
		addClientProcess()
	
	}else{
		alert("Please a service to continue")
	}
	
})

