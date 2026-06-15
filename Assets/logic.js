const welcomePage = document.getElementById("WelcomeScreen")
const consolesSection = document.getElementById("consoles")
const shapeArea = document.getElementById("shape")
const addNewTesterSection = document.getElementById("addNewTesterSection")
const privacyPolicyContainer = document.getElementById("privacy-policy-container")
const termsContainer = document.getElementById("terms-container")
const aboutUsSection = document.getElementById("about-us-section")

//Menu Buttons 

const home = document.getElementById("home")
const about = document.getElementById("about")
const privacy = document.getElementById("privacy")
const terms = document.getElementById("terms")
const contact = document.getElementById("contact")
const about2 = document.getElementById("about2")
const privacy2 = document.getElementById("privacy2")
const terms2 = document.getElementById("terms2")
const contact2 = document.getElementById("contact2")

const dialogBackground = document.getElementById("dialogBackground")
const closeBtn = document.getElementById("closeBtn")
const alertMessage = document.getElementById("alertMessage")
const promptDialog = document.getElementById("promptDialog")
const promptText = document.getElementById("promptText")
const yesBtn = document.getElementById("yesBtn")
const noBtn = document.getElementById("noBtn")
const menuShape = document.getElementById("menu-shape")
const mother = document.getElementById("mother")
const header = document.getElementById("header")
const menuList = document.getElementById("menu-list")
const menuBtn = document.getElementById("menuBtn")
const getStartedBtn = document.getElementById("get-started-btn")
const closeMsgInput = document.getElementById("closeMsgInput")
const adMobSection = document.getElementById("adMobSection")

const loadingWindow = document.getElementById("loadingWindow")
const alertDialogBox = document.getElementById("alertDialogBox")
const adMobSecondCount = document.getElementById("adMobSecondCount")
const admobCountSection = document.getElementById("admobCountSection")
const fileUploadSection = document.getElementById("fileUploadSection")
const selectApkInput = document.getElementById("selectApkInput")
const selectApkBtn = document.getElementById("selectApkBtn")
const uploadApkBtn = document.getElementById("uploadApkBtn")
const fileName = document.getElementById("fileName")

const csvCard = document.getElementById("csvCard")
const inputHeader = document.getElementById("csvExplanation")
const csvExplanation = document.getElementById("fileName")
const csvInputSection = document.getElementById("csvInputSection")
const csvDropArea = document.getElementById("csvDropArea")
const csvUploadIcon = document.getElementById("csvUploadIcon")
const csvUploadTitle = document.getElementById("csvUploadTitle")
const csvUploadSub = document.getElementById("csvUploadSub")
const csvSelector = document.getElementById("csvSelector")

//Add new tester inputs 

const userFirstNameInput = document.getElementById("userFirstNameInput")
const userLastNameInput = document.getElementById("userLastNameInput")
const emailInput = document.getElementById("emailInput")
const resAddOne = document.getElementById("resAddOne")
const resAddTwo = document.getElementById("resAddTwo")
const resAddThree = document.getElementById("resAddThree")
const region = document.getElementById("region")
const zipCode = document.getElementById("zipCode")
const countrySelected = document.getElementById("countrySelected")
const countrySelectHolder = document.getElementById("countrySelectHolder")
const contactNumber = document.getElementById("contactNumber")
const passwordInput = document.getElementById("passwordInput")
const passwordConfirmInput = document.getElementById("passwordConfirmInput")
const sqInput = document.getElementById("sqInput")
const sqaInput = document.getElementById("sqaInput")
const addTesterInit = document.getElementById("addTesterInit")
const listDialogBox = document.getElementById("listDialogBox")
const selectMessage = document.getElementById("selectMessage")
const generalListing = document.getElementById("generalListing")

const openMessagingButton = document.getElementById("openMessagingButton")
const openMessageIcon = document.getElementById("openMessageIcon")
const contactUsMessageInput = document.getElementById("contact-us-message-input")
const messageEmailAddress = document.getElementById("messageEmailAddress")
const contactUsInput = document.getElementById("contact-us-input")
const contactUsSend = document.getElementById("contact-us-send")
const closeAlertBtn = document.getElementById("closeAlertBtn")


const mainAdDisplay = document.getElementById("mainAdDisplay")
const mainSection = document.getElementById("mainSection")

const applicationRecievedSection = document.getElementById("applicationRecievedSection")
const appDoneBtn = document.getElementById("appDoneBtn")

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString)

let selectedCountry = null

let xArray = [
	csvUploadIcon,
	csvUploadTitle,
	csvUploadSub
]

welcomePage.style.display = "block"
welcomePage.style.opacity = "1"

dialogBackground.style.opacity = "0"
dialogBackground.style.visibility = "hidden"
closeBtn.style.visibility = "hidden"

let adDisplayed = false
let start = false

let count = 10

// Define your scroll threshold in pixels
const pixelThreshold = 1000; 

let promptActive = false
let menuActive = false
let uploadOpen = false
let loaderActive = false
let listActive = false
let alertActive = false

let yesFunction = null
let noFunction = null
let alertQueue = []


let windowTrack = {
	"lastWindow":welcomePage
}


let shapePage = null

function showMenuBar(show){
	if(show == true){
		header.style.display = "block"
		setTimeout(()=>{
			header.style.opacity = "1"
		},10)
	}else{
		header.style.opacity = "0"
		setTimeout(()=>{
			header.style.display = "none"
		},300)
	}
}



function openLoader(showClose){
	loadingWindow.style.display = "block"
	loaderActive = true
	setTimeout(()=>{
		openDialogBackground(true,showClose)
		setTimeout(()=>{
			loadingWindow.style["margin-top"] = "5%"
			setTimeout(()=>{
				loadingWindow.style["opacity"] = "1"
			},300)
		},400)
	},10)
}

function closeLoader(showClose){
	loadingWindow.style["opacity"] = "0"
	
	setTimeout(()=>{
		loadingWindow.style["margin-top"] = "300%"
		setTimeout(()=>{
			loadingWindow.style.display = "none"
			loaderActive = false
			setTimeout(()=>{
				if(listActive == false && alertActive == false && uploadOpen == false && listActive == false && promptActive == false && loaderActive == false){
					openDialogBackground(false)
				}
			},30)
		},400)
	},400)
}

function closePrompt(){
	promptText.innerHTML = null
	promptDialog.style["opacity"] = "0"
	setTimeout(()=>{
		promptDialog.style["margin-top"] = "300%"
		setTimeout(()=>{
			promptDialog.style.display = "none"
			promptActive = false
			setTimeout(()=>{
				if(listActive == false && alertActive == false && uploadOpen == false && listActive == false && promptActive == false && loaderActive == false){
					openDialogBackground(false)
				}
			},30)
		},800)
	},300)
}

function prompt(msg,yesFunc,noFunc){
	
	if(promptActive == false){
		
		promptActive = true
		promptText.innerHTML = msg
		openDialogBackground(true,true)
		setTimeout(()=>{
			promptDialog.style.display = "block"
			setTimeout(()=>{
				promptDialog.style["margin-top"] = "5%"
				setTimeout(()=>{
					promptDialog.style["opacity"] = "1"
				},300)
			},300)
		},10)
		
	}else{
		promptText.style.opacity = "0"
		setTimeout(()=>{			
			promptText.innerHTML = alertQueue[alertQueue.length-1]
			setTimeout(()=>{	
				promptText.style.opacity = "1"
			},300)
		},30)
	}
	
	yesFunction = ()=>{yesFunc()}
	if(!noFunc){		
		noFunction = ()=>{
			closePrompt()
		}
	}else{
		noFunction = ()=>{
			noFunc()
		}
	}
	
	yesBtn.addEventListener("click",()=>{
		yesFunction()
		setTimeout(()=>{
			
			closePrompt()
			
		},300)
	})
	noBtn.addEventListener("click",()=>{noFunction()})
	
}

function alert(msg){
	
	if(alertQueue.includes(msg) == false){
		
		alertQueue.push(msg)
		
		if(alertActive == false){
			alertActive = true
			alertMessage.innerHTML = alertQueue[alertQueue.length-1]
			openDialogBackground(true,true)
			setTimeout(()=>{
				alertDialogBox.style.display = "block"
				setTimeout(()=>{
					alertDialogBox.style["margin-top"] = "5%"
					setTimeout(()=>{
						alertDialogBox.style["opacity"] = "1"
					},300)
				},300)
			},10)
			
		}else{
			alertMessage.style.opacity = "0"
			setTimeout(()=>{			
				alertMessage.innerHTML = alertQueue[alertQueue.length-1]
				setTimeout(()=>{	
					alertMessage.style.opacity = "1"
				},300)
			},30)
		}
	
	}
	
}

function closeAlert(){
	
	alertMessage.innerHTML = null
	alertDialogBox.style["opacity"] = "0"
	setTimeout(()=>{
		alertDialogBox.style["margin-top"] = "300%"
		setTimeout(()=>{
			alertDialogBox.style.display = "block"
			alertActive = false
			setTimeout(()=>{
				if(listActive == false && alertActive == false && uploadOpen == false && listActive == false && promptActive == false && loaderActive == false){
					openDialogBackground(false)
				}
			},30)
		},800)
	},300)
	
}
function openListDialog(){
	
	openDialogBackground(true)
	setTimeout(()=>{
		listDialogBox.style.display = "block"
		listActive = true
		setTimeout(()=>{
			listDialogBox.style["margin-top"] = "5%"
			setTimeout(()=>{
				listDialogBox.style["opacity"] = "1"
			},100)
		},10)
	},800)
	
}

function closeListDialog(){
	listDialogBox.style["opacity"] = "0"
	setTimeout(()=>{
		listDialogBox.style["margin-top"] = "300%"
		setTimeout(()=>{
			listDialogBox.style.display = "none"
			listActive = false
			setTimeout(()=>{
				if(listActive == false && alertActive == false && uploadOpen == false && listActive == false && promptActive == false && loaderActive == false){
					openDialogBackground(false)
				}
			},10)
		},300)
	},200)
	
}

function openDialogBackground(display,showClose){
	if(display == true){		
		dialogBackground.style.display = "block"
		setTimeout(()=>{
			dialogBackground.style["opacity"] = "1"
		},30)
		if(showClose && showClose == true){
			closeBtn.style.display = "none"
		}else if(!showClose){
			closeBtn.style.display = "block"
		}else{
			closeBtn.style.display = "none"
		}
	}else{
		dialogBackground.style["opacity"] = "0"
		setTimeout(()=>{
			dialogBackground.style.display = "none"
		},300)
	}
	
}

function resizeBodyToDevice() {
    document.body.style.width = window.innerWidth + 'px';
    document.body.style.height = window.innerHeight + 'px';
}

//Section functions 

function openMenuDialog(show){
	
	if(show == true){
		menuShape.style.display = "block"
		menuList.style.display = "block"
		menuActive = true
		setTimeout(()=>{			
			menuShape.style.opacity = "1"
			setTimeout(()=>{		
				if(window.innerWidth > 990){					
					menuShape.style["height"] = "50%"
				}else{
					menuShape.style["height"] = "400px"
				}
				setTimeout(()=>{			
					menuList.style["opacity"] = "1"
				},300)
			},300)
		},300)
	}else{
		menuList.style.opacity = "0"
		setTimeout(()=>{	
			menuShape.style.opacity = "0"
			setTimeout(()=>{			
				menuShape.style["height"] = "0px"
				setTimeout(()=>{			
					menuShape.style.display = "block"
					menuList.style.display = "block"
					menuActive = false
				},800)
			},300)
		},300)
	}
	
}

menuBtn.addEventListener("click",()=>{
	
	if(menuActive == false){
		openMenuDialog(true)
		menuBtn.src = "Images/menuactive.png"
	}else{
		openMenuDialog(false)
		menuBtn.src = "Images/menuinactive.png"
	}
	
})

function openGetStarted(){
	showMenuBar(true)
	if(shapePage != null){
		shapePage.style.opacity = "0"
		setTimeout(()=>{
			shapePage.style.display = "none"
		},310)
	}
	
	setTimeout(()=>{
		if(window.innerWidth > 990){
			shapeArea.style["overflow"]="hidden"
			shapeArea.style["margin-left"]="20%"
			shapeArea.style["margin-top"]="20%"
			shapeArea.style["height"]="40px"
			shapeArea.style["width"]="40px"
			shapeArea.style["border-radius"]="20px"
		}else{
			shapeArea.style["overflow"]="hidden"
			shapeArea.style["margin-left"]="50%"
			shapeArea.style["margin-top"]="20%"
			shapeArea.style["height"]="40px"
			shapeArea.style["width"]="40px"
			shapeArea.style["border-radius"]="20px"
		}
		welcomePage.style.opacity = "0"
		setTimeout(()=>{
			welcomePage.style.display = "none"
			consolesSection.style.display = "block"
			setTimeout(()=>{
				consolesSection.style.opacity = "1"
				setTimeout(()=>{
					if(window.innerWidth > 990){
						shapeArea.style["margin-top"]="10%"
						shapeArea.style["margin-left"]="0.5%"
						shapeArea.style["height"]="90%"
						shapeArea.style["width"]="95%"
					}else{
						shapeArea.style["margin-top"]="20%"
						shapeArea.style["margin-left"]="0.5%"
						shapeArea.style["height"]="60%"
						shapeArea.style["width"]="95%"
					}
					setTimeout(()=>{
						addNewTesterSection.style.display = "block"
						shapeArea.style["overflow-y"]="scroll"
						setTimeout(()=>{
							addNewTesterSection.style.opacity = "1"
							shapePage = addNewTesterSection
						},10)
					},300)
				},800)
			},10)
		},800)
	},300)
	if(menuActive){
		openMenuDialog(false)
	}
}

function openAboutSection(){
	showMenuBar(true)
	if(shapePage != null){
		shapePage.style.opacity = "0"
		setTimeout(()=>{
			shapePage.style.display = "none"
		},310)
	}
	
	setTimeout(()=>{
		
		if(window.innerWidth > 990){
			shapeArea.style["overflow"]="hidden"
			shapeArea.style["margin-left"]="20%"
			shapeArea.style["margin-top"]="20%"
			shapeArea.style["height"]="40px"
			shapeArea.style["width"]="40px"
			shapeArea.style["border-radius"]="20px"
		}else{
			shapeArea.style["overflow"]="hidden"
			shapeArea.style["margin-left"]="50%"
			shapeArea.style["margin-top"]="20%"
			shapeArea.style["height"]="40px"
			shapeArea.style["width"]="40px"
			shapeArea.style["border-radius"]="20px"
		}
		welcomePage.style.opacity = "0"
		setTimeout(()=>{
			welcomePage.style.display = "none"
			consolesSection.style.display = "block"
			setTimeout(()=>{
				consolesSection.style.opacity = "1"
				setTimeout(()=>{
					if(window.innerWidth > 990){
						shapeArea.style["margin-top"]="10%"
						shapeArea.style["margin-left"]="0.5%"
						shapeArea.style["height"]="90%"
						shapeArea.style["width"]="95%"
					}else{
						shapeArea.style["margin-top"]="20%"
						shapeArea.style["margin-left"]="0.5%"
						shapeArea.style["height"]="60%"
						shapeArea.style["width"]="95%"
					}
					setTimeout(()=>{
						aboutUsSection.style.display = "block"
						shapeArea.style["overflow-y"]="scroll"
						setTimeout(()=>{
							aboutUsSection.style.opacity = "1"
							shapePage = aboutUsSection
						},10)
					},300)
				},800)
			},10)
		},800)
	},300)
	if(menuActive){
		openMenuDialog(false)
	}
	
}

function openPrivacySection(){
	
	showMenuBar(true)
	if(shapePage != null){
		shapePage.style.opacity = "0"
		setTimeout(()=>{
			shapePage.style.display = "none"
		},310)
	}
	
	setTimeout(()=>{
		
		if(window.innerWidth > 990){
			shapeArea.style["overflow"]="hidden"
			shapeArea.style["margin-left"]="20%"
			shapeArea.style["margin-top"]="20%"
			shapeArea.style["height"]="40px"
			shapeArea.style["width"]="40px"
			shapeArea.style["border-radius"]="20px"
		}else{
			shapeArea.style["overflow"]="hidden"
			shapeArea.style["margin-left"]="50%"
			shapeArea.style["margin-top"]="20%"
			shapeArea.style["height"]="40px"
			shapeArea.style["width"]="40px"
			shapeArea.style["border-radius"]="20px"
		}
		
		welcomePage.style.opacity = "0"
		setTimeout(()=>{
			welcomePage.style.display = "none"
			consolesSection.style.display = "block"
			setTimeout(()=>{
				consolesSection.style.opacity = "1"
				setTimeout(()=>{
					if(window.innerWidth > 990){
						shapeArea.style["margin-top"]="10%"
						shapeArea.style["margin-left"]="0.5%"
						shapeArea.style["height"]="90%"
						shapeArea.style["width"]="95%"
					}else{
						shapeArea.style["margin-top"]="20%"
						shapeArea.style["margin-left"]="0.5%"
						shapeArea.style["height"]="60%"
						shapeArea.style["width"]="95%"
					}
					
					setTimeout(()=>{
						privacyPolicyContainer.style.display = "block"
						shapeArea.style["overflow-y"]="scroll"
						setTimeout(()=>{
							privacyPolicyContainer.style.opacity = "1"
							shapePage = privacyPolicyContainer
						},10)
					},300)
				},800)
			},10)
		},800)
	},300)
	if(menuActive){
		openMenuDialog(false)
	}
	
}

function openTermsAndConditions(){
	showMenuBar(true)
	if(shapePage != null){
		shapePage.style.opacity = "0"
		setTimeout(()=>{
			shapePage.style.display = "none"
		},310)
	}
	
	setTimeout(()=>{
		if(window.innerWidth > 990){
			shapeArea.style["overflow"]="hidden"
			shapeArea.style["margin-left"]="20%"
			shapeArea.style["margin-top"]="20%"
			shapeArea.style["height"]="40px"
			shapeArea.style["width"]="40px"
			shapeArea.style["border-radius"]="20px"
		}else{
			shapeArea.style["overflow"]="hidden"
			shapeArea.style["margin-left"]="50%"
			shapeArea.style["margin-top"]="20%"
			shapeArea.style["height"]="40px"
			shapeArea.style["width"]="40px"
			shapeArea.style["border-radius"]="20px"
		}
		welcomePage.style.opacity = "0"
		setTimeout(()=>{
			welcomePage.style.display = "none"
			consolesSection.style.display = "block"
			setTimeout(()=>{
				consolesSection.style.opacity = "1"
				setTimeout(()=>{
					if(window.innerWidth > 990){
						shapeArea.style["margin-top"]="10%"
						shapeArea.style["margin-left"]="0.5%"
						shapeArea.style["height"]="90%"
						shapeArea.style["width"]="95%"
					}else{
						shapeArea.style["margin-top"]="20%"
						shapeArea.style["margin-left"]="0.5%"
						shapeArea.style["height"]="60%"
						shapeArea.style["width"]="95%"
					}
					setTimeout(()=>{
						termsContainer.style.display = "block"
						shapeArea.style["overflow-y"]="scroll"
						setTimeout(()=>{
							termsContainer.style.opacity = "1"
							shapePage = termsContainer
						},10)
					},300)
				},800)
			},10)
		},800)
	},300)
	if(menuActive){
		openMenuDialog(false)
	}
}

function goToHome(){
	if(shapePage != null){
		shapePage.style.opacity = "0"
		setTimeout(()=>{
			shapePage.style.display = "none"
		},310)
	}
	
	setTimeout(()=>{
		shapeArea.style["overflow"]="hidden"
		shapeArea.style["margin-left"]="20%"
		shapeArea.style["margin-top"]="20%"
		shapeArea.style["height"]="40px"
		shapeArea.style["width"]="40px"
		shapeArea.style["border-radius"]="20px"
		consolesSection.style.opacity = "0"
		setTimeout(()=>{
			consolesSection.style.display = "none"
			welcomePage.style.display = "block"
			setTimeout(()=>{
				welcomePage.style.opacity = "1"
			},10)
		},800)
	},300)
	if(menuActive){
		openMenuDialog(false)
	}
}

function openMessagingSection(){
	
	
	openMessagingButton.style.opacity = "0"
	setTimeout(()=>{
		openMessagingButton.style.visibility = "hidden"
		adMobSection.style.visibility = "hidden"
		setTimeout(()=>{
			showMenuBar(false)
			goToHome()
			setTimeout(()=>{
				openDialogBackground(true,true)
				setTimeout(()=>{
					contactUsMessageInput.style.display = "block"
					setTimeout(()=>{
						contactUsMessageInput.style.opacity = "1"
					},10)
				},300)
			},800)
			
			if(menuActive){
				openMenuDialog(false)
			}
		},30)
	},300)
	
}

function closeMessagingSection(){
	
	contactUsMessageInput.style.opacity = "0"
	openMessagingButton.style.opacity = "1"
	setTimeout(()=>{
		openMessagingButton.style.visibility = "visible"
		adMobSection.style.visibility = "visible"
		setTimeout(()=>{
			openDialogBackground(false)
			setTimeout(()=>{
				
				setTimeout(()=>{
					contactUsMessageInput.style.display = "none"
				},10)
			},300)
			
			if(menuActive){
				openMenuDialog(false)
			}
		},30)
	},300)
	
}

function openUploadSection(){
	fileUploadSection.style["display"] = "block"
	setTimeout(()=>{
		openDialogBackground(true,true)
		setTimeout(()=>{
			fileUploadSection.style["margin-top"] = "10%"
			setTimeout(()=>{
				fileUploadSection.style["opacity"] = "1"
			},200)
		},800)
	},10)
		
}

function closeUploadSection(){
	fileUploadSection.style["margin-top"] = "300%"
	setTimeout(()=>{
		fileUploadSection.style["opacity"] = "0"
		setTimeout(()=>{
			fileUploadSection.style["display"] = "block"
			setTimeout(()=>{
				openDialogBackground(false)
			},300)
		},20)
	},100)
	
}


function setCountry(country,li){
	selectedCountry = country
	li.style.color = "#376ca8"
	setTimeout(()=>{
		closeListDialog()
	},300)
}

function openCountrySelector(){
	
	generalListing.innerHTML = null
	selectMessage.innerHTML = "Select Country"
	
	let countries = [
		"Australia",
        "Afghanistan",
        "Albania",
        "Algeria",
        "Angola",
        "Argentina",
        "Armenia",
        "Aruba",
        "Austria",
        "Azerbaijan",
        "Belgium",
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
        "Botswana",
        "Brazil",
        "Brunei",
        "Bulgaria",
        "Burundi",
        "CFA",
        "CFP",
        "Cambodia",
        "Canada",
        "Cape Verde",
        "Cayman Islands",
        "Chili Peso",
        "China",
        "Colombia",
        "Comoros",
        "Congo",
        "Costa Rica",
        "Croatia",
        "Cuba",
        "Cyprus",
        "Czech",
        "Denmark",
        "Djibouti",
        "Dominican Republich",
        "East Caribbean",
        "Egypt",
        "El Salvador",
        "Estonia",
        "Ethiopia",
        "Falkland Islands",
        "Finland",
        "Fiji",
        "Gambia",
        "Georgia",
        "Germany",
        "Ghana",
        "Gibraltar",
        "Great Britain",
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
        "Nicaragua ",
        "Nigeria",
        "North Korea",
        "Norway",
        "Oman",
        "Pakistan",
        "Panama",
        "Papua New Guinea",
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
        "Somali ",
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
        "USA ",
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
	
	for(var i=0; i<countries.length; i++){
		
		let li = document.createElement("li")
		li.setAttribute("class","countryItem")
		li.style.color = "black"
		li.style.cursor = "pointer"
		li.innerHTML = countries[i]
		li.addEventListener("click",(event)=>{
			setCountry(li.innerHTML,li)
			countrySelected.innerHTML = event.target.innerHTML
		})
		generalListing.appendChild(li)
		
	}
	
	openListDialog()
	
}



function generateId(){
        
    let numbers = [0,1,2,3,4,5,6,7,8,9]

    let mainNumber = []

    for (var i=0; i<numbers.length;i++) {

        numbers.shuffle()

        let number = numbers[Math.Random()]

        if (mainNumber.size != 6) {
            mainNumber.add(number)
        } else {
            break
        }

    }

    var output = userId +
            `${mainNumber[0]}` +
            `${mainNumber[1]}` +
            `${mainNumber[2]}` +
            `${mainNumber[3]}` +
            `${mainNumber[4]}` +
            `${mainNumber[5]}`

    return output

}

function generateByPassCode(){
	var output = "CD-"
	let array = [0,1,2,3,4,5,6,7,8,9]
	for(var i=0; i<array.length ; i++){
		array.shuffle()
		output = `${output}${array[i]}`
	}
	return output
}

let mtp_email_regex = RegExp("(?:[a-z0-9!#\$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#\$%&'*+/=?^_`{|}~-]+)*|\"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21\\x23-\\x5b\\x5d-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21-\\x5a\\x53-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])+)])")

function checkInputFields(){
    var output = false
    
    let array = [
                
        userFirstNameInput,
        userLastNameInput,
        emailInput,
        contactNumber,
        resAddOne,
        resAddTwo,
        resAddThree,
        region,
        cityInput,
        zipCode,
        sqInput,
        sqaInput,
        passwordInput,
        passwordConfirmInput
    ]
	
    var filled = 0
    for (var i=0; i<array.length; i++) {
        if (i != resAddThree) {
            if (i.text != null && i.text != "") {
                filled = filled + 1
            }
        } else {
            filled = filled + 1
        }
    }
    if (filled == array.size) {
        var correct = 0
        for (var i =0; i< array.length; i++) {
            let input = i.text
            if (i == userFirstNameInput || i == userLastNameInput) {
                let regex = RegExp("[A-Za-z]")
                if (regex.test(input)) {
                    correct = correct + 1
                } else {
                    alert("First name and last name can only contain letters.")
                }
            }
            if (i == cityInput) {
                let regex = RegExp("[A-Za-z]")
                if (regex.test(input)) {
                    correct = correct + 1
                } else {
                    alert("City can only contain letters.")
                }
            }
            if (i == zipCode) {
                let regex = RegExp("[A-Za-z0-9#/-]")
                if (regex.test(input)) {
                    correct = correct + 1
                } else {
                    alert("Special characters allowed: #/-")
                }
            }
            if (i == emailInput) {
                if (mtp_email_regex.test(input)) {
                    correct = correct + 1
                } else {
                    alert("Invalid email address")
                }
            }
            if (i == resAddOne || i == resAddTwo || i == resAddThree || i == districtRegionProvince) {
                let regex = RegExp("[A-Za-z0-9#/-]")
                if (i != resAddThree && regex.test(input)) {
                    correct = correct + 1
                } else {
                    if(i == region){
                        alert("District / Region / Province can only contain letters, number and these special characters: #/-")
                    }

                    if(i == resAddOne){
                        alert("Residential Address line 1 can only contain letters, number and these special characters: #/-")
                    }

                    if(i == resAddTwo){
                        alert("Residential Address line 2 can only contain letters, number and these special characters: #/-")
                    }

                    if(i == resAddThree){
                        if (i.text != null && i.text != ""){
                            alert("Residential Address line 3 can only contain letters, number and these special characters: #/-")
                        } else {
                            correct = correct + 1
                        }
                    }

                }
            }
            if (i == passwordInput) {
                if (passwordInput.text === passwordConfirmInput.text) {
                    let regex = Regex("[A-Za-z*#/-][0-9]{1,}")
                    if (regex.test(input)) {
                        correct = correct + 2
                    } else {
                        alert("Password can only contain letters, atleast 1 number and these special characters: *#/-")
                    }
                } else {
                    alert("Passwords do not match")
                }
            }
            if (i == sqInput || i == sqaInput || i == bio) {
                correct = correct + 1
            }
            if (i == contactNumber) {
                let regex = RegExp("[+0-9]")
                if (regex.test(input)) {
                    correct = correct + 1
                } else {
                    alert("Contact number invalid")
                }
            }
        }
    } else {
        alert("Please fill all text fields with the relevant information")
    }
    
    return output
}

addTesterInit.addEventListener("click",async()=>{
    //check input fields first
    
    if(checkInputFields()){
        
        let userId = generateId()
        
        let newUser = {
            id : userId,
            bio : "None",
			firstName : userFirstNameInput.text,
			lastName : userLastNameInput.text,
			dateCreated : currentDate,
			addressDetails : {
				
				"resAddOne":resAddOne.text, 
				"resAddTwo":resAddTwo.text, 
				"resAddThree":resAddThree.text, 
				"country":selectedCountry, 
				"zipCode":zipCode.text,
				"region":region.text,
				"city":cityInput.text
			} ,
			emailAddress: emailInput.text,
			dateOfBirth: currentDate,
			whatsapp: "None",
			calls: contactNumber,
			currentProfileImage: null,
			gender: "Male",
			submissions: [],
			jobs: [],
			incompleteJobs: [],
			problems: [],
			password: passwordInput.text,
			secretQuestion: sqInput.text,
			secretQuestionAnswer: sqaInput.text,
			byPassCode: generateByPassCode(),
			verified: false,
			subscribed: false,
			accountStatus: "Active",
			preferredCurrency: "None",
			problemsSolved: [],
			notifications: [],
			jobsViewed: [],
			problemsViewed: [],
			projects: [],
			activeJobs: [],
			selectedFontSize: 14.0,
			cashTransfers:[],
			paymentDetails: null,
			preferences: {
				enableCodeSuggestions: true,
				enableMethodInjections: true,
				enableAISuggestions: true
			},
			updateQueue: [],
			appTesterStatus: "Pending",
			submittedProjects: []
        }
        
		let body = {
			"method":"POST",
			"body":newUser,
			"Content-Type":{"type":"application/json"}
		}
		
		let sendData = await fetch("/add-new-user",body)
		
		let response = await sendData.json()
		
		let status = response.status 
		
		if(status === "success"){
			
			showMenuBar(false)
			if(shapePage != null){
				shapePage.style.opacity = "0"
				setTimeout(()=>{
					shapePage.style.display = "none"
				},310)
			}
			
			setTimeout(()=>{
				if(window.innerWidth > 990){
					shapeArea.style["overflow"]="hidden"
					shapeArea.style["margin-left"]="20%"
					shapeArea.style["margin-top"]="20%"
					shapeArea.style["height"]="40px"
					shapeArea.style["width"]="40px"
					shapeArea.style["border-radius"]="20px"
				}else{
					shapeArea.style["overflow"]="hidden"
					shapeArea.style["margin-left"]="50%"
					shapeArea.style["margin-top"]="20%"
					shapeArea.style["height"]="40px"
					shapeArea.style["width"]="40px"
					shapeArea.style["border-radius"]="20px"
				}
				setTimeout(()=>{
					consolesSection.style.display = "block"
					setTimeout(()=>{
						consolesSection.style.opacity = "1"
						setTimeout(()=>{
							setTimeout(()=>{
								applicationRecievedSection.style.display = "block"
								setTimeout(()=>{
									applicationRecievedSection.style.opacity = "1"
									shapePage = applicationRecievedSection
								},10)
							},300)
						},800)
					},10)
				},800)
			},300)
			if(menuActive){
				openMenuDialog(false)
			}
			
		}else{
			alert("Something went wrong. Please try again later")
		}
		
    }
})

function displayMainAdSection(){
	mainSection.style.display = "none"
	mainAdDisplay.style.visibility = "visible"
	openMessagingButton.style.display = "none"
}

async function handleDownload(){
	try{
		const r = await fetch(`${window.location.origin}/download-app`);
		if(!r.ok){ throw new Error("Download unavailable") };
		const blob = await r.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "CriterianDeveloper.apk";
		document.body.appendChild(a);
		a.click();a.remove();
		setTimeout(()=>URL.revokeObjectURL(url),4000);
	}catch(e){console.error(e);alert("Download temporarily unavailable.");}
	finally{if(btn){btn.classList.remove("downloading");btn.style.pointerEvents="auto";}}
}


// Track the scroll position
welcomePage.addEventListener('scroll', () => {
	if (welcomePage.scrollTop >= pixelThreshold) {
		showMenuBar(true)
	} else {
		showMenuBar(false)
	}
});
csvSelector.addEventListener("change",()=>{
	csvUploadTitle.innerHTML = csvSelector.files[0].name
})
closeBtn.addEventListener("click",()=>{
	if(adMobSection.style.visibility === "hidden" && adDisplayed == true){
		
		if(listActive == false && alertActive == false && uploadOpen == false && listActive == false && promptActive == false && loaderActive == false){
			openDialogBackground(false)
		}else{	
			if(loaderActive == true){
				closeLoader()
			}else{
				if(alertActive == true){
					closeAlert()
				}else{
					if(promptActive == true){
						closePrompt()
					}else{						
						if(listActive == true){
							closeListDialog()
						}
					}
				}
			}
		}
	}else{
		adMobSection.style.visibility = "hidden"
		openDialogBackground(false)
	}
})
window.addEventListener('load', resizeBodyToDevice);
window.addEventListener('resize', resizeBodyToDevice);

closeMsgInput.addEventListener("click",()=>{
	closeMessagingSection()
})

getStartedBtn.addEventListener("click",()=>{
	openGetStarted()
})

about.addEventListener("click",()=>{
	openAboutSection()
})
privacy.addEventListener("click",()=>{
	openPrivacySection()
})	

terms.addEventListener("click",()=>{
	openTermsAndConditions()
})
home.addEventListener("click",()=>{
	goToHome()
})

about2.addEventListener("click",()=>{
	openAboutSection()
})
privacy2.addEventListener("click",()=>{
	openPrivacySection()
})	

terms2.addEventListener("click",()=>{
	openTermsAndConditions()
})




//Messaging functionality

openMessagingButton.addEventListener("mousedown",()=>{
	openMessagingButton.style["background"] = "#376ca8"
	openMessagingButton.style["box-shadow"] = "0px 0px 1px"
	openMessageIcon.src = "Images/messageactive.png"
})

openMessagingButton.addEventListener("mouseup",()=>{
	openMessagingButton.style["background"] = "white"
	openMessagingButton.style["box-shadow"] = "0px 0px 3px"
	openMessageIcon.src = "Images/messageinactive.png"
})

openMessageIcon.addEventListener("mousedown",()=>{
	openMessagingButton.style["background"] = "#376ca8"
	openMessagingButton.style["box-shadow"] = "0px 0px 1px"
	openMessageIcon.src = "Images/messageactive.png"
})

openMessageIcon.addEventListener("mouseup",()=>{
	openMessagingButton.style["background"] = "white"
	openMessagingButton.style["box-shadow"] = "0px 0px 3px"
	openMessageIcon.src = "Images/messageinactive.png"
})

openMessageIcon.addEventListener("click",()=>{
	goToHome()
	setTimeout(()=>{
		openMessagingSection()
	},500)
})
openMessagingButton.addEventListener("click",()=>{
	setTimeout(()=>{
		openMessagingSection()
	},500)
})

contactUsSend.addEventListener("click",async()=>{
	
	openLoader()
	
	if(contactUsInput.text == null || contactUsInput.text == ""){
		alert("Please type in a message to continue")
	}else{
		if(messageEmailAddress.text == null && messageEmailAddress.text == ""){
			alert("Please type in a email address to continue")
		}else{
			let test = mtp_email_regex.test(messageEmailAddress.text)
			if(test == true){
				//Send message to server
				let message = {
					"date":currentDate,
					"message":contactUsMessageInput,
					"emailAddress":messageEmailAddress.text
				}
				
				let body = {
					"method":"POST",
					"body":message,
					"headers":{"Content-Type":"application/json"}
				}
				
				let sendData = await fetch("/send-suggestion-message",body)
				
				let response = await sendData.json()
				
				let status = response.status 
				
				if(status == "success"){
					
					closeLoader()
					
					setTimeout(()=>{
							
						if(shapePage != null){
							shapePage.style.opacity = "0"
							setTimeout(()=>{
								shapePage.style.display = "none"
							},310)
						}
						
						setTimeout(()=>{
							shapeArea.style["overflow"]="hidden"
							shapeArea.style["margin-left"]="20%"
							shapeArea.style["margin-top"]="20%"
							shapeArea.style["height"]="40px"
							shapeArea.style["width"]="40px"
							shapeArea.style["border-radius"]="20px"
							shapeArea.style["opacity"]="0"
							consolesSection.style.opacity = "0"
							setTimeout(()=>{
								consolesSection.style.display = "none"
								setTimeout(()=>{
									welcomePage.style.display = "block"
									welcomePage.style.opacity = "0"
									setTimeout(()=>{
										welcomePage.style.opacity = "1"
										setTimeout(()=>{
											shapePage = null
										},30)
									},300)
								},10)
							},800)
						},300)
						if(menuActive){
							openMenuDialog(false)
						}
						
					},700)
					
					
				}else{
					alert("Something went wrong. Please try again later")
				}
				
			}
		}
	}
	
})
countrySelected.addEventListener("mousedown",()=>{
	countrySelectHolder.style["box-shaodw"] = "0px 0px 1px black"
	openCountrySelector()
})
countrySelected.addEventListener("mouseup",()=>{
	countrySelectHolder.style["box-shaodw"] = "0px 0px 7px black"
})

countrySelectHolder.addEventListener("mousedown",()=>{
	countrySelectHolder.style["box-shaodw"] = "0px 0px 1px black"
	openCountrySelector()
})
countrySelectHolder.addEventListener("mouseup",()=>{
	countrySelectHolder.style["box-shaodw"] = "0px 0px 7px black"
})

countrySelectHolder.addEventListener("click",()=>{
	openCountrySelector()
})
appDoneBtn.addEventListener("click",()=>{
	if(shapePage != null){
		shapePage.style.opacity = "0"
		setTimeout(()=>{
			shapePage.style.display = "none"
		},310)
	}
	
	setTimeout(()=>{
		shapeArea.style["overflow"]="hidden"
		shapeArea.style["margin-left"]="20%"
		shapeArea.style["margin-top"]="20%"
		shapeArea.style["height"]="40px"
		shapeArea.style["width"]="40px"
		shapeArea.style["border-radius"]="20px"
		shapeArea.style["opacity"]="0"
		consolesSection.style.opacity = "0"
		setTimeout(()=>{
			consolesSection.style.display = "none"
			setTimeout(()=>{
				welcomePage.style.display = "block"
				welcomePage.style.opacity = "0"
				setTimeout(()=>{
					welcomePage.style.opacity = "1"
					setTimeout(()=>{
						shapePage = null
					},30)
				},300)
			},10)
		},800)
	},300)
	if(menuActive){
		openMenuDialog(false)
	}
})

closeAlertBtn.addEventListener("click",()=>{
	closeAlert()
})
 
contact.addEventListener("click",()=>{
	openMessagingSection()
})
contact2.addEventListener("click",()=>{
	openMessagingSection()
})



setInterval(()=>{
	if(adDisplayed == false && start == true){				
		count = count-1
		adMobSecondCount.innerHTML = `${count} seconds`
		if(count == 0){
			adDisplayed = true 
			start = false
		}
	}
},1000)

if(queryString === "?adView"){
	displayMainAdSection()
}else{
	setTimeout(()=>{
		dialogBackground.style.visibility = "visible"
		setTimeout(()=>{
			dialogBackground.style.opacity = "1"
			start = true
			setTimeout(()=>{
				closeBtn.style.visibility = "visible"
				adDisplayed = true
				start = false
				setTimeout(()=>{
					admobCountSection.style.opacity = "0"
				},30)
			},10000)
		},10)
	},1000*5)
}

for(var i=0; i<xArray.length; i++){
	
	xArray[i].addEventListener("click",()=>{
		csvSelector.click()
	})
	
}