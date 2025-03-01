

function CheckPasswordStrong(pwd) {
    if (pwd == null || pwd == "") {
        return "Password must not be null"
    }
    else {
        if (typeof pwd === 'string') {
            if (pwd.length < 6) {
                return "Password must contain atleast 6 characters"
            }
            else {
                var re = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
                if (re.test(pwd)) {
                    return true;
                }
                else {
                    return "Password is too week, Must contain atleast one symbol,uppercase,lowecase letters and number"
                }
            }
        } else {
            return "Password must be string"
        }
    }
}


module.exports = { CheckPasswordStrong };