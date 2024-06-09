// משתנים גלובליים

var selectedRow = null;
var selectedSuspectID = null;
var selectedRow_even_odd;

//איבנתים

window.addEventListener("load", async () => {
    await refreshDataBase();
});
document.getElementById("addSuspect").addEventListener('click',async ()=>{
    const blocker = document.createElement('div');
    blocker.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.1);z-index:10;";
    const response = await fetch('/externalHTMLs/suspects/addSuspect.html');
    blocker.innerHTML = await response.text();
    document.body.appendChild(blocker);

    //close form event
    document.getElementById("close").addEventListener('click',()=>{
        blocker.remove();
    });

    //submit the form
    document.getElementById("addSuspectForm").addEventListener('submit',async (event)=>{
        event.preventDefault();
        
        //get all the values
        const fNameVal = document.getElementsByName("firstname")[0].value;
        const lNameVal = document.getElementsByName("lastname")[0].value;
        const ssnVal = document.getElementsByName("ssn")[0].value;
        const licensePlateVal = document.getElementsByName("licenseplate")[0].value;

        //check inputs validity
        const isValid = checkInput(fNameVal,lNameVal,ssnVal,licensePlateVal);

        //if invalid stop submiting process
        if(isValid){
            document.getElementById("addSuspectForm").submit();
        }else{
            return;
        }
    })
});
document.getElementById("editSuspect").addEventListener('click',async ()=>{
    if(selectedSuspectID==null){
        return;
    }
    //get the slected users data
    const value = selectedRow.getElementsByTagName('td');
    
    const firstName = value[1].innerHTML;
    const lastName = value[2].innerHTML;
    const ssn = value[3].innerHTML;
    const licenseplate = value[4].innerHTML;
    
    //add blocker and fetch edit form
    const blocker = document.createElement('div');
    blocker.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.1);z-index:10;";
    const response = await fetch('/externalHTMLs/suspects/editSuspect.html');
    blocker.innerHTML = await response.text();
    document.body.appendChild(blocker);

    //set the fields in the form according to the selected user
    document.getElementsByName("firstname")[0].setAttribute('value',firstName);
    document.getElementsByName("lastname")[0].setAttribute('value',lastName);
    document.getElementsByName("ssn")[0].setAttribute('value',ssn);
    document.getElementsByName("licenseplate")[0].setAttribute('value',licenseplate);

    //close form event
    document.getElementById("close").addEventListener('click',()=>{
        blocker.remove();
    });

    //submit the form
    document.getElementById("editSuspectForm").addEventListener('submit',(event)=>{
        event.preventDefault();

        const fNameVal = document.getElementsByName("firstname")[0].value;
        const lNameVal = document.getElementsByName("lastname")[0].value;
        const ssnVal = document.getElementsByName("ssn")[0].value;
        const licensePlateVal = document.getElementsByName("licenseplate")[0].value;
        
        const isValid = checkInput(fNameVal,lNameVal,ssnVal,licensePlateVal);
        if(isValid){
            document.getElementsByName('suspectID')[0].value = selectedSuspectID;
            document.getElementById("editSuspectForm").submit();
        }else{
            return;
        }
        
    })

});
document.getElementById("refresh").addEventListener('click',async ()=>{
    await refreshDataBase();
});
document.getElementById("searchBTN").addEventListener('click',async ()=>{
    //325501534
    const ssn_value = document.getElementById("searchValue").value;

    if(ssn_value.length!=9||isValidIsraeliID(ssn_value)==false){
        alert("Incorect Innput has to be 9 number  and VALID israeli ID");
        return;
    }else{
        const currentURL = window.location.href+"/searchsuspect";
        const response = await fetch(currentURL,{
            method:"POST",
            headers:{
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({
                "ssnSearch":ssn_value
            })
        })
        const data = await response.json();
        if(data[0]==undefined){
            alert("Suspect with that SSN doesn't exist");
        }else{
            const suspectID = data[0]['suspect_id'];
            selectedSuspectID = suspectID
            const suspectFirstName = data[0]['first_name'];
            const suspectLastName = data[0]['last_name'];
            const suspectSSN = data[0]['ssn'];
            const licensePlate = data[0]['license_plate'];
            const isSpotted = (data[0]['is_spotted']==1)?'True':'False';

            card = `
                <td>${suspectID}</td>
                <td>${suspectFirstName}</td>
                <td>${suspectLastName}</td>
                <td>${suspectSSN}</td>
                <td>${licensePlate}</td>
                <td>${isSpotted}</td>
            `
            row = document.createElement('tr');
            row.innerHTML = card;

            row.style.cssText = "background-color: #1078ff;color: white;cursor: default;";
            document.getElementById("suspectsDatabaseTable").innerHTML = '';

            document.getElementById("suspectsDatabaseTable").appendChild(row);

            document.getElementById("fullnameField").innerHTML = `Fullname ${suspectFirstName} ${suspectLastName}`;
            document.getElementById("ssnField").innerHTML = `SSN: ${suspectSSN}`;
            document.getElementById("licensePlateField").innerHTML = `License Plate: ${licensePlate}`;
            document.getElementById("isSpottedField").innerHTML = `Is Spotted: ${isSpotted}`;
        }
    }
    document.getElementById("searchValue").value = "";
});
document.getElementById("deleteSuspect").addEventListener('click',async ()=>{
    if(selectedSuspectID==null){
        alert("Select Suspect");
        return;
    }
    if(!confirm(`Are You Sure You Want To Delete Suspect Wth ID:${selectedSuspectID}`)){
        return;
    }else{
        const currentURL = window.location.href+'/deletesuspect';
        await fetch(currentURL,{
            method:'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({selected_suspect_id: selectedSuspectID})
        });
        refreshDataBase();    
    }
});

//פונקציות

async function refreshDataBase(){
    //clear html table
    document.getElementById("suspectsDatabaseTable").innerHTML = '';

    //send post request to backend to receive the users database
    const currentURL = window.location.href;
    const response = await fetch(currentURL,{method:'POST'});
    const database = await response.json();

    //check if database is not empty
    if(database.length<1){
        return;
    }

    //for loop object in databse which is row
    for(let i = 0;i<database.length;i++){

        row = database[i];

        //retreive the user data from the response
        const suspectID = row['suspect_id'];
        const suspectFirstName = row['first_name'];
        const suspectLastName = row['last_name'];
        const suspectSSN = row['ssn'];
        const licensePlate = row['license_plate'];
        const isSpotted = (row['is_spotted']==1)?'True':'False';
        
        //create inner html card for the current row
        card = `
            <td>${suspectID}</td>
            <td>${suspectFirstName}</td>
            <td>${suspectLastName}</td>
            <td>${suspectSSN}</td>
            <td>${licensePlate}</td>
            <td>${isSpotted}</td>
        `

        //create tr element to server as html table row
        const currentRow = document.createElement('tr');
        //set the inner html of the created html row to the previously created card
        currentRow.innerHTML = card;

        if(i==0){
            selectedSuspectID = suspectID;
            selectedRow = currentRow;
            selectedRow.style.cssText = "background-color: #1078ff;color: white;cursor: default;";
            
            document.getElementById("fullnameField").innerHTML = `Fullname ${suspectFirstName} ${suspectLastName}`;
            document.getElementById("ssnField").innerHTML = `SSN: ${suspectSSN}`;
            document.getElementById("licensePlateField").innerHTML = `License Plate: ${licensePlate}`;
            document.getElementById("isSpottedField").innerHTML = `Is Spotted: ${isSpotted}`;
        }

        currentRow.addEventListener('click',()=>{
            //previous row
            selectedRow.style.backgroundColor = (i%2!=0)?"#31363F":"#222831";
            selectedRow.style.cssText = "color: white;cursor: pointer;";
            //current row
            selectedSuspectID = suspectID;
            selectedRow = currentRow;
            selectedRow.style.cssText = "background-color: #1078ff;color: white;cursor: default;";
            
            document.getElementById("fullnameField").innerHTML = `Fullname ${suspectFirstName} ${suspectLastName}`;
            document.getElementById("ssnField").innerHTML = `SSN: ${suspectSSN}`;
            document.getElementById("licensePlateField").innerHTML = `License Plate: ${licensePlate}`;
            document.getElementById("isSpottedField").innerHTML = `Is Spotted: ${isSpotted}`;
        })
        document.getElementById("suspectsDatabaseTable").appendChild(currentRow);
    }
    return 0;
}
function checkInput(first_name,last_name,SSN,license_plate){  
    
    flag = true;

    if(!isAlphaBetic(first_name)){
        document.getElementsByName("firstname")[0].style.cssText = "background-color:rgb(255, 180, 180)";
        flag = false;
    }else{
        document.getElementsByName("firstname")[0].style.cssText = "background-color:white";
    }

    if(!isAlphaBetic(last_name)){
        document.getElementsByName("lastname")[0].style.cssText = "background-color:rgb(255, 180, 180)";
        flag = false;
    }else{
        document.getElementsByName("lastname")[0].style.cssText = "background-color:white";
    }

    if(!isValidIsraeliID(SSN)){
        document.getElementsByName("ssn")[0].style.cssText = "background-color:rgb(255, 180, 180)";
        flag = false;
    }else{
        document.getElementsByName("ssn")[0].style.cssText = "background-color:white";
    }
    if(!isValidLicensePlate(license_plate)){
        document.getElementsByName("licenseplate")[0].style.cssText = "background-color:rgb(255, 180, 180)";
        flag = false;
    }else{
        document.getElementsByName("licenseplate")[0].style.cssText = "background-color:white";
    }
    
    return flag;
}
function isAlphaBetic(str){
    if(str == ""){
        return false;
    }
    for(let i=0;i<str.length;i++){
        if(!(str[i] >= 'a' && str[i] <= 'z') && !(str[i] >= 'A' && str[i] <= 'Z')){
            return false;
        }
    }
    return true;
}
function isValidIsraeliID(ssn) {
    if(ssn==""){
        return false;
    }
	id = String(ssn).trim();
	if (ssn.length > 9 || isNaN(ssn)){
        return false;
    }
    if(id.length < 9){
        id = ("00000000" + id).slice(-9)
    }
	return Array.from(id, Number).reduce((counter, digit, i) => {
		const step = digit * ((i % 2) + 1);
		return counter + (step > 9 ? step - 9 : step);
	}) % 10 === 0;
}
function isValidEmail(str){

    // Check if email value is empty
    if(str == ""){
        return false;
    }

    // Check if there is @ and . in the email field
    if (str.indexOf('@') === -1 || str.indexOf('.') === -1) {
        return false;
    }

    // Check if '@' appears before '.'
    if (str.indexOf('@') > str.lastIndexOf('.')) {
        return false;
    }

    // Check if there are no spaces
    if (str.indexOf(' ') !== -1) {
        return false;
    }

    // Check if there are consecutive dots
    if (str.includes('..')) {
        return false;
    }

    // Check if the domain has at least one character
    if (str.substring(str.lastIndexOf('.') + 1).length < 1) {
        return false;
    }

    return true;
}
function isNumeric(str){
    if(str==""){
        return false;
    }
    for(let i=0;i<str.length;i++){
        if(!(str[i]>='0'&&str[i]<='9')){
            return false;
        }
    }
    return true;
}
function isValidLicensePlate(str){
    if(0<str.length<10&&isNumeric(str)){
        return true;
    }
    return false;
}