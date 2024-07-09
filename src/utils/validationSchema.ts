import { isValidObjectId } from 'mongoose';
import * as yup from 'yup';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/;

yup.addMethod(yup.string, 'email', function validateEmail(message) {
    return this.matches(emailRegex , {
        message,
        name:'email',
        excludeEmptyString: true,
    }) ;
});

export const newUserSchema = yup.object({
    name: yup.string().required("Name is Missing"),
    email: yup.string().email("Invalid email!").required("Email is missing"),
    password: yup.string().required("Password is missing").min(8,"Password should be at least 8 characters").matches(passwordRegex, "Password is too short")
});

export const verifyTokenSchema = yup.object({

    id: yup.string().test({
        name: 'Valid-id',
        message:"Invalid user id",
        test: (value) => {
            return isValidObjectId(value)
        },
    }),
    token: yup.string().required("Token is missing"),
});
