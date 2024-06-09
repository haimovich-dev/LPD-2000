//מוסיף מאזין אירועים לטופס התחברות אשר מאזין לאירוע של שליחת הטופס
document.getElementById('loginForm').addEventListener('submit',(event)=>{
    //מבטל את שליחת הטופס בשביל לבדוק את הערכים
    event.preventDefault();
    //מושך את הערכים מהטופס
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    //בודק עם שם המשתמש מורכב ממספרים ואותיות בלבד ולא עולה על אורך של 20
    if(username.length<1||username.length>20||!isAlphaNumeric(username)){
        document.getElementById('username').style.cssText = "background-color:rgb(255, 180, 180)";
        return false;
    }
    //בודק עם ערך של הסיסמא לא ריק
    if(password.length<1){
        document.getElementById('username').style.cssText = "background-color:white";
        document.getElementById('password').style.cssText = "background-color:rgb(255, 180, 180)";
        return false;
    }
    //אם הכל תקין שולח את הטופס
    else{
        document.getElementById('loginForm').submit();
    }
})

function isAlphaNumeric(str){
    //בודק עם המחרוזת לא ריקה
    if(str==""){
        return false;
    }
    //בודק אם כל תוו נמצא בתווך של האותיות או מספרים אם לא מחזיר שקר אחרת אמת
    for(let i=0;i<str.length;i++){
        if(!(str[i]>='0'&&str[i]<='9')&&!(str[i] >= 'a' && str[i] <= 'z') && !(str[i] >= 'A' && str[i] <= 'Z')){
            return false;
        }
    }
    return true;
}