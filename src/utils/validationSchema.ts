import { parseISO } from 'date-fns';
import { isValidObjectId } from 'mongoose';
import categories from 'src/categories';
import * as yup from 'yup';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex =
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/;

yup.addMethod(yup.string, 'email', function validateEmail(message) {
    return this.matches(emailRegex, {
        message,
        name: 'email',
        excludeEmptyString: true,
    });
});

const password = {
    password: yup.string().required("Password is missing").min(8, "Password should be at least 8 characters").matches(passwordRegex, "Password is too short")

}

export const newUserSchema = yup.object({
    name: yup.string().required("Name is Missing"),
    email: yup.string().email("Invalid email!").required("Email is missing"),
    ...password
});

const tokenAndId = {
    id: yup.string().test({
        name: 'Valid-id',
        message: "Invalid user id",
        test: (value) => {
            return isValidObjectId(value)
        },
    }),
    token: yup.string().required("Token is missing"),
}

export const verifyTokenSchema = yup.object({
    ...tokenAndId
});

export const resetPassSchema = yup.object({

    ...tokenAndId,
    ...password,
});

export const newProductSchema = yup.object({
    name: yup.string().required('Name is missing!'),
    description: yup.string().required('Description is missing!'),
    category: yup.string().oneOf(categories, "Invalid category!").required("Category is missing!"),
    price: yup.string().transform((value) => {
        if (isNaN(+value)) return "";

        return +value;
    })
        .required("Price is missing"),
    // purchasingDate: yup.string().matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/).required("Purchasing date is missing"),
    purchasingDate: yup.string().transform((value) => {
        try {
            return parseISO(value)
            
        } catch (error) {
    return "";
        }

    })
        .required("Purchasing date is missing"),
})