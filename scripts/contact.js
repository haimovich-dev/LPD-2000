
// LISTENERS

//הוספת מאזין אירועים אסינכרוני לטופס יצירת הקשר, כאשר שולחים את הטופס הקוד באירוע מתרחש
document.getElementById("contactForm").addEventListener('submit',async (event)=>{
    //מניעת האירוע של שליחת הטופס כברירת מחדל, אני רוצה לבדוק את הערכים בשדות קודם
    event.preventDefault();

    //משיכת הערכים מהטופס על מנת שאוכל לבדוק אותם
    const first_name = document.getElementsByName("firstName")[0].value;
    const last_name = document.getElementsByName("lastName")[0].value;
    const email_address = document.getElementsByName("emailAddress")[0].value;
    const phone_number = document.getElementsByName("phoneNumber")[0].value;
    const text = document.getElementsByName("text")[0].value;

    //פה אני מזמן פונקציה שבודקת תקינות של הערכים
    const isValid = checkInput(first_name,last_name,email_address,phone_number,text);
    
    //אם נכון אז אני שולח את הערכים לצד שרת ומקבל תשובה שאותה אני מציג למשתמש
    if(isValid){
        //שומר את הכתובת הנוכחית
        const currentURL = window.location.href;
        //מזמן את הצד האחורי של השרת עם ״פאכץ׳״ שבו אני מציב את הערכים של השדות ושולח בתור ״ג׳ייסון״
        const response = await fetch(currentURL,{
            method:"POST",
            headers:{
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({
                "first_name": first_name,
                "last_name": last_name,
                "email_address": email_address,
                "phone_number": phone_number,
                "text": text
            })
        })
        document.getElementsByName("firstName")[0].value = "";
        document.getElementsByName("lastName")[0].value = "";
        document.getElementsByName("emailAddress")[0].value = "";
        document.getElementsByName("phoneNumber")[0].value = "";
        document.getElementsByName("text")[0].value = "";
        if(response.ok){
            alert("message successfully sent");
        }else{
            alert("error");
        }
    }

})

// FUNCTIONS

//פונקציה אשר בודקת את תקינות השדות ומחזירה אמת או שקר בהתאם
function checkInput(first_name,last_name,email_address,phone_number,text){

    //פה אני מזמן פונקציה שבודקת האם הערך מכיל רק אותיות
    if(!isAlphaBetic(first_name)){
        //אם הערך לא מכיל רק אותיות אז אני צובע את הרקע של השדה לצבע אדום
        document.getElementsByName("firstName")[0].style.cssText = "background-color:rgb(255, 180, 180)";
        //ומודיע למשתמש איזה ערך להקליד בשדה
        alert("First Name has to be alphabetic less then 50 letters");
        return false;
    }else{
        //אם הערך תקין אז אני משנה את צבע השדה ללבן במקרה שלפני זה היה אדום
        document.getElementsByName("firstName")[0].style.cssText = "background-color:white";
    }
    //את הפעולות האלו אני מבצע עבור כל שדה בהתאם לערך שלו למשל אימייל אני בודק עם פונקציה אחרת

    if(!isAlphaBetic(last_name)){
        document.getElementsByName("lastName")[0].style.cssText = "background-color:rgb(255, 180, 180)";
        alert("Last Name has to be alphabetic less then 50 letters");
        return false;
    }else{
        document.getElementsByName("lastName")[0].style.cssText = "background-color:white";
    }

    if(!isValidEmail(email_address)){
        document.getElementsByName("emailAddress")[0].style.cssText = "background-color:rgb(255, 180, 180)";
        alert("incorrect email address");
        return false;
    }else{
        document.getElementsByName("emailAddress")[0].style.cssText = "background-color:white";
    }

    if(!isValidPhoneNumber(phone_number)){
        document.getElementsByName("phoneNumber")[0].style.cssText = "background-color:rgb(255, 180, 180)";
        alert("Phone Number has to be only 10 numbers");
        return false;
    }else{
        document.getElementsByName("phoneNumber")[0].style.cssText = "background-color:white";
    }

    if(!isValidText(text)||text.length>1000){
        document.getElementsByName("text")[0].style.cssText = "background-color:rgb(255, 180, 180)";
        alert("Text has to be alphabetic less then 1000 letters");
        return false;
    }else{
        document.getElementsByName("text")[0].style.cssText = "background-color:white";
    }

    return true;
}
function isValidPhoneNumber(str){
    //אם אורך המחרוזת לא שווה ל-10 אז שקר, או שהתוו הראשון לא שווה ל-0 והתוו השני לא שווה ל-5
    if(str.length!=10||str[0]!='0'||str[1]!='5'){
        return false;
    }
    //בודק עם כל תוו במחרוזת הוא מספר
    for(let i=0;i<10;i++){
        if(!(str[i]>='0'&&str[i]<='9')){
            return false;
        }
    }
    return true;
}
function isValidEmail(str){
    //בודק עם המחרוזת גדולה מ-5
    if(str.length<5){
        return false;
    }
    //מגדיר משתנה בשביל לשמור את מיקום הנקודה האחרונה במחרוזת
    lastDotIndex = -1;
    //מגדיר משתנה בשביל לשמור את מיקום של השטרודל במחרוזת
    shtrudelIndex = -1;
    //מגדיר משתנה בשביל לשמור את כמות בשטרודלים במחרוזת
    shtrudeCNT = 0;
    //מבצע לולאת פור על כל תוו במחרוזת
    for(let i=0;i<str.length;i++){
        //אם התוו הוא שטרודל אז שומר את המיקום שלו ומעלה את כמות השטרודלים באחד
        if(str[i]=='@'){
            shtrudelIndex = i;
            shtrudeCNT++;
        }
        //אם התוו הוא נקודה אז שומא את מיקומה
        if(str[i]=='.'){
            lastDotIndex = i;
        }
    }
    //אם אין שטרודל, או שאין נקודה, או שהנקודה נמצא בתווא האחרון של המחרוזת
    //או שהשטרודל הוא התוו הראשון במחרוזת, או שאין שטרודלים בכלל אז הערך אינו תקין
    if(shtrudelIndex==-1||lastDotIndex==-1||lastDotIndex==str.length-1||shtrudelIndex==0||shtrudeCNT!=1){
        return false;
    }
    return true;
}
function isAlphaBetic(str){
    //בודק עם המחרוזת לא ריקה, אם כן מחזיר שקר
    if(str == ""){
        return false;
    }
    //עובר על כל תוו במחרוזת
    for(let i=0;i<str.length;i++){
        //אם התוו לא נמצא בתווך של האותיות אז אני מחזיר שקר אחר אמת
        if(!(str[i] >= 'a' && str[i] <= 'z') && !(str[i] >= 'A' && str[i] <= 'Z')){
            return false;
        }
    }
    return true;
}
function isValidText(str){
    if(str == ""){
        return false;
    }
    for(let i=0;i<str.length;i++){
        if((str[i] >= 'a' && str[i] <= 'z') || (str[i] >= 'A' && str[i] <= 'Z') || (str[i]=="'") || (str[i]==" ")){
            continue;
        }else{
            return false
        }
    }
    return true;
}