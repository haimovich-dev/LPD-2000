// משתנים גלובליים

var selectedRow = null;
var selectedUserID = null;
var selectedRow_even_odd;

//איבנטים

//מאזין לטעינה מלאה של העמוד
window.addEventListener("load", async () => {
    //מזמן פונקציה אשר מושכת את הטבלה של המשתמשים
    await refreshDataBase();
});
//מאזין אסנכרוני ללחיצה על הכפתור התנתקות
document.getElementById("logout").addEventListener('click',async ()=>{
    //שולח את המשתמש לחלון הלוגין
    window.location.href = '/logout';
});
//מאזין אסנכרוני ללחיצה על הכפתור חיפוש משתמש
document.getElementById("searchBTN").addEventListener('click',async()=>{
    //מושך את ערך השדה בעת הלחיצה
    const userSSN = document.getElementById("searchValue").value;

    //בודק את תקינות הערך, אם לא תקין אז מודיע למנהל ומוחק את הערך מהשדה
    if(userSSN.length!=9||isValidIsraeliID(userSSN)==false){
        alert("Incorect Innput has to be 9 number and VALID israeli ID");
        return;
    }else{
        //יוצר משתנה אשר מכיל קישור לצד האחורי של השרת
        const currentURL = window.location.href+"/searchuser";
        //עושה זימון לצד האחורי של השרת עם מתוד פוסט ומידע בפורמט של ג׳ייסון עם הת״ז של המשתמש
        const response = await fetch(currentURL,{
            method:"POST",
            headers:{
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({
                "ssnSearch":userSSN
            })
        })
        //מחכה לתשובה
        const data = await response.json();
        
        //בודק עם התשובה שהתקבלה קיימת אם לא אז מודיע שמשתמש לא נמצא
        if(data[0]==undefined){
            alert("User with that SSN doesn't exist");
        }else{
            //שומר את הנתונים של המשתמש מהתשובה שהתקבלה
            const userID = data[0]['user_id'];
            selectedUserID = userID;
            const userFirstName = data[0]['first_name'];
            const userLastName = data[0]['last_name'];
            const userSSN = data[0]['ssn'];
            const username = data[0]['username'];
            const userPhoneNumber = data[0]['phone_number'];
            const userEmailAddress = data[0]['email_address'];
            const userPrivilege = (data[0]['isAdmin']==1)?'admin':'user';

            //יוצר כרטיסיית אייצ׳תיאמאל אשר מציגה את נתוני המשתמש בתור תאים עבור תגית של שורה
            card = `
                <td>${userID}</td>
                <td>${userFirstName}</td>
                <td>${userLastName}</td>
                <td>${userSSN}</td>
                <td>${username}</td>
                <td>${userEmailAddress}</td>
                <td>${userPhoneNumber}</td>
                <td>${userPrivilege}</td>
            `
            //יוצר אלמנט של שורה
            row = document.createElement('tr');
            //מאחסן בשורה שיצרתי את הכרטיסיה עם נתוני המשתמש
            row.innerHTML = card;

            //מעצב את השורה שייצרתי
            row.style.cssText = "background-color: #1078ff;color: white;cursor: default;";
            //מנקה את הטבלה הנוכחית
            document.getElementById("usersDatabaseTable").innerHTML = '';
            //מוסיף לטבלה הריקה את השורה שמכילה את נתוני המשתמש שהתבקשו
            document.getElementById("usersDatabaseTable").appendChild(row);
        }
    }
    //מנקה את שדה החיפוש
    document.getElementById("searchValue").value = "";
})
//מאזין אסנכרוני לרענון של טבלת המשתמשים
document.getElementById("refresh").addEventListener('click',async ()=>{
    //מזמן פונקציה אסנכרונית ומחכה שתסתיים
    await refreshDataBase();
});
//מאזין אסינכרוני למחיקת משתמש
document.getElementById("deleteUser").addEventListener('click',async ()=>{
    //בודק אם מזהה משתמש לא ריק אם ריק אז מודיע שיש לבחור משתמש למחיקה
    if(selectedUserID==null){
        alert("Select User");
        return;
    }
    //בודק אם מזהה המשתמש לא שווה למזהה של המנהל אם כן אז מודיע שאי אפשר למחוק מנהל ראשי
    if(selectedUserID==1){
        alert("Can't Delete Main Admin User");
        return;
    }
    //לאחר מכן שואל האם בטוח רוצה למחוק את המשתמש הנבחר
    if(!confirm(`Are You Sure You Want To Delete User With ID:${selectedUserID}`)){
        // אם לא אז לא קורה כלום
        return;
    }else{
        // אחרת פונה לצד השרת עם מתוד פוסט ומזהה של המשתמש הנבחר למחיקה כג׳ייסון בגוף הפניה
        const currentURL = window.location.href+'/userdelete';
        await fetch(currentURL,{
            method:'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({selected_user_id: selectedUserID})
        });
        //לאחר מכן מזמן פונקציה לחידוש הטבלה
        await refreshDataBase();
    }
});
//מאזין אסינכרוני לעדכון פרטי משתמש קיים
document.getElementById("editUser").addEventListener('click',async ()=>{
    //בודק אם אכן נבחר משתמש לעדכון פרטים אם לא לא קורה כלום
    if(selectedUserID==null){
        return;
    }
    //אם המשתמש הנבחר הוא מנהל ראשי מודיע שעדכון פרטים אינו אפשרי
    if(selectedUserID==1){
        alert("Can't Edit Main Admin User");
        return;
    }
    // שומר את הנתונים של המשתמש הנבחר
    const value = selectedRow.getElementsByTagName('td');
    const id = value[0].innerHTML; // used for sql commands
    const firstName = value[1].innerHTML;
    const lastName = value[2].innerHTML;
    const ssn = value[3].innerHTML;
    const username = value[4].innerHTML;
    const emailAddress = value[5].innerHTML;
    const phoneNumber = value[6].innerHTML;
    const privilege = value[7].innerHTML;

    //מוסיף רקע שקוף על מנת שאי אפשר יהיה ללחוץ על כפתורים בזמן שהטופס פתוח
    const blocker = document.createElement('div');
    blocker.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.1);z-index:10;";
    //מזמן את הטופס של שינוי משתמש מהשרת
    const response = await fetch('/externalHTMLs/admin/editUser.html');
    blocker.innerHTML = await response.text();
    //מוסיף אותו כאלמנט חדש מעל הרקע השקוף
    document.body.appendChild(blocker);

    //מציב את ערכי המשתמש שנשמרו קודם לטופס בהתאם לשדות
    document.getElementsByName("firstname")[0].setAttribute('value',firstName);
    document.getElementsByName("lastname")[0].setAttribute('value',lastName);
    document.getElementsByName("ssn")[0].setAttribute('value',ssn);
    document.getElementsByName("username")[0].setAttribute('value',username);
    document.getElementsByName("emailaddress")[0].setAttribute('value',emailAddress);
    document.getElementsByName("phonenumber")[0].setAttribute('value',phoneNumber);
    document.getElementsByName("privilege")[0].value = (privilege=='admin')?1:0;

    //מוסיף מאזין לסגירת הטופס
    document.getElementById("close").addEventListener('click',()=>{
        blocker.remove();
    });

    //מוסיף מאזין לשליחת הטופס
    document.getElementById("edituserForm").addEventListener('submit',(event)=>{
        //מבטל את האירוע כברירת מחדל לשליחת הטופס
        event.preventDefault();

        //שומר את הערכים מכל השדות בטופס
        const firstName = document.getElementsByName("firstname")[0].value;
        const lastName = document.getElementsByName("lastname")[0].value;
        const ssn = document.getElementsByName("ssn")[0].value;
        const username = document.getElementsByName("username")[0].value;
        const emailAddress = document.getElementsByName("emailaddress")[0].value;
        const phoneNumber = document.getElementsByName("phonenumber")[0].value;

        //בודק האם הערכים בשדות תקינים אם לא צובע באדום את השדה שלא תקין
        const isValid = checkInput(firstName,lastName,ssn,emailAddress,username,phoneNumber);

        //אם תקין אז מוסיף את מזהה המשתמש שעבורו עודכנו הפרטים ושולח את הטופס אחרת לא קורה כלום
        if(isValid){
            document.getElementsByName('userID')[0].value = selectedUserID;
            document.getElementById("edituserForm").submit(); 
        }else{
            return;
        }
    })
});
//מאזין אסינכרוני ליצירת משתמש חדש
document.getElementById("addUser").addEventListener('click',async ()=>{
    //הוספת רקע שקוף
    const blocker = document.createElement('div');
    blocker.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(255,255,255,0.1);z-index:10;";
    //זימון טופס הוספת משתמש מהשרת
    const response = await fetch('/externalHTMLs/admin/addUser.html');
    blocker.innerHTML = await response.text();
    //הצגת הטופס מעל הרקע השקןף
    document.body.appendChild(blocker);

    //הוספת מאזין לסגירת הטופס
    document.getElementById("close").addEventListener('click',()=>{
        blocker.remove();
    });

    //הוספת מאזין לשליחת הטופס
    document.getElementById("adduserForm").addEventListener('submit',async(event)=>{
        //ביטול האירוע כברירת מחדל לשליחת הטופס
        event.preventDefault();

        //שמירה של הערכים בעת שליחת הטופס
        const firstName = document.getElementsByName('firstname')[0].value;
        const lastName = document.getElementsByName('lastname')[0].value;
        const ssn = document.getElementsByName('ssn')[0].value;
        const username = document.getElementsByName('username')[0].value;
        const phoneNumber = document.getElementsByName('phonenumber')[0].value;
        const emailAddress = document.getElementsByName('emailaddress')[0].value;
        
        //בדיקת תקינות ערכי הטופס אם ערך אינו תקין צובע את השדה באדום ומודיע למנהל על השגיאה
        const isValid = checkInput(firstName,lastName,ssn,emailAddress,username,phoneNumber);
        
        //אם הערכים תקינים אז שולח את הטופס לשרת אחרת לא קורה כלום
        if(isValid==true){
            document.getElementById("adduserForm").submit();
        }else{
            return;
        }
    })
});

//פונקציות

//פונקציה אסינכרונית לקבלת טבלת משתמשים ממוסד הנתונים בשרת
async function refreshDataBase(){
    //ניקוי הטבלה הנוכחית
    document.getElementById("usersDatabaseTable").innerHTML = '';

    //שליחת בקשה לשרת וקבלת נתונים בפורמט של ג׳ייסון
    const currentURL = window.location.href;
    const response = await fetch(currentURL,{method:'POST'});
    const database = await response.json();

    //אם הטבלה שהתקבלה אורכה נמוך מאחד לא קורה כלום כי אין נתונים להציג
    if(database.length<1){
        return;
    }

    //אם נתונים קיימים אז עבור כל שורה שהתקבלה מתבצע הקוד הבא
    for(let i = 0;i<database.length;i++){

        //לצורך הנוכות שומר כל תא במערך של הנתונים שהתקבלו במשתנה בשם שורה
        row = database[i];

        //מוציא את נתוניהמשתמש מהשורה הנוכחית
        const userID = row['user_id'];
        const userFirstName = row['first_name'];
        const userLastName = row['last_name'];
        const userSSN = row['ssn'];
        const username = row['username'];
        const userPhoneNumber = row['phone_number'];
        const userEmailAddress = row['email_address'];
        const userPrivilege = (row['isAdmin']==1)?'admin':'user';
        
        //יוצר כרטיסיית אייצ׳טיאמאל אם נתוני המשתמש הנוכחי
        card = `
            <td>${userID}</td>
            <td>${userFirstName}</td>
            <td>${userLastName}</td>
            <td>${userSSN}</td>
            <td>${username}</td>
            <td>${userEmailAddress}</td>
            <td>${userPhoneNumber}</td>
            <td>${userPrivilege}</td>
        `

        //יוצר אלמנט של שורה עבור הטבלה
        const currentRow = document.createElement('tr');
        //מציב את הכרטיסיה לתוך השורה בתור התוכן שלה
        currentRow.innerHTML = card;

        //אם המשתמש הנוכחי הוא המשתמש הראשון ברשימה אז בוחר אותו אוטומטית
        if(i==0){
            selectedUserID = userID;
            selectedRow = currentRow;
            selectedRow.style.cssText = "background-color: #1078ff;color: white;cursor: default;";
        }

        // עבור כל משתמש מוסיף מאזין ללחיצה על מנת לשנות רקע ולקבוע מזהה של המשתמש הנבחר
        currentRow.addEventListener('click',()=>{
            //previous row
            selectedRow.style.backgroundColor = (i%2!=0)?"#31363F":"#222831";
            selectedRow.style.cssText = "color: white;cursor: pointer;";
            //current row
            selectedUserID = userID;
            selectedRow = currentRow;
            selectedRow.style.cssText = "background-color: #1078ff;color: white;cursor: default;";
        })
        //מוסיף א השורה לטבלה
        document.getElementById("usersDatabaseTable").appendChild(currentRow);
    }
};
function checkInput(first_name,last_name,SSN,email_address,username,phone_number){  

    if(!isAlphaBetic(first_name)){
        document.getElementsByName("firstname")[0].style.cssText = "background-color:rgb(255, 180, 180)";
        alert("First Name value has to be alphabetic less then 50 chars");
        return false;
    }else{
        document.getElementsByName("firstname")[0].style.cssText = "background-color:white";
    }

    if(!isAlphaBetic(last_name)){
        document.getElementsByName("lastname")[0].style.cssText = "background-color:rgb(255, 180, 180)";
        alert("Last Name value has to be alphabetic less then 50 chars");
        return false;
    }else{
        document.getElementsByName("lastname")[0].style.cssText = "background-color:white";
    }

    if(!isValidIsraeliID(SSN)){
        document.getElementsByName("ssn")[0].style.cssText = "background-color:rgb(255, 180, 180)";
        return false;
    }else{
        document.getElementsByName("ssn")[0].style.cssText = "background-color:white";
    }
    
    if(!isValidEmail(email_address)){
        document.getElementsByName("emailaddress")[0].style.cssText = "background-color:rgb(255, 180, 180)";
        return false;
    }else{
        document.getElementsByName("emailaddress")[0].style.cssText = "background-color:white";
    }

    if(!isAlphaNumeric(username)){
        document.getElementsByName("username")[0].style.cssText = "background-color:rgb(255, 180, 180)";
        return false;
    }else{
        document.getElementsByName("username")[0].style.cssText = "background-color:white";
    }

    if(!isValidPhoneNumber(phone_number)){
        document.getElementsByName("phonenumber")[0].style.cssText = "background-color:rgb(255, 180, 180)";
        return false;
    }else{
        document.getElementsByName("phonenumber")[0].style.cssText = "background-color:white";
    }

    return true;
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
//פונקציה לבדיקת תקינות של ת״ז
function isValidIsraeliID(ssn) {
    //אם ריק או גדול מ-9 מחזיר שקר
    if(ssn==""||ssn.length<9){
        return false;
    }
    //אחרת בודק לפי אלגוריתם קבוע את תקינות הת״ז אם תקין מחזיר אמת אחרת שקר
	return Array.from(ssn, Number).reduce((counter, digit, i) => {
		const step = digit * ((i % 2) + 1);
		return counter + (step > 9 ? step - 9 : step);
	}) % 10 === 0;
}
function isValidEmail(str){
    if(str.length<5){
        return false;
    }
    lastDotIndex = -1;
    shtrudelIndex = -1;
    shtrudeCNT = 0;
    for(let i=0;i<str.length;i++){
        if(str[i]=='@'){
            shtrudelIndex = i;
            shtrudeCNT++;
        }
        if(str[i]=='.'){
            lastDotIndex = i;
        }
    }
    if(shtrudelIndex==-1||lastDotIndex==-1||lastDotIndex==str.length-1||shtrudelIndex==0||shtrudeCNT!=1){
        return false;
    }
    return true;
}
function isAlphaNumeric(str){
    if(str==""){
        return false;
    }
    for(let i=0;i<str.length;i++){
        if(!(str[i]>='0'&&str[i]<='9')&&!(str[i] >= 'a' && str[i] <= 'z') && !(str[i] >= 'A' && str[i] <= 'Z')){
            return false;
        }
    }
    return true;
}
function isValidPhoneNumber(str){
    if(str.length!=10||str[0]!='0'||str[1]!='5'){
        return false;
    }
    for(let i=0;i<10;i++){
        if(!(str[i]>='0'&&str[i]<='9')){
            return false;
        }
    }
    return true;
}