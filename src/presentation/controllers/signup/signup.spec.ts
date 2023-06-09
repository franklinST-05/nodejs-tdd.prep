/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, expect, test, vitest } from 'vitest';

import { MissingParamError, InvalidParamError } from '../../errors';
import { SignUpController } from './signup';
import { HttpRequest, EmailValidator, AddAccount, AddAccountModel, AccountModel } from './signup-protocols';


const makeAddAccount = () => {
    class AddAcountStub implements AddAccount {
        async run(account: AddAccountModel): Promise<AccountModel> {
            return {
                id: '$id-valido',
                name: 'John Doe',
                email: 'johndoe@gmail.com',
                password: 'qwe123'
            };
        }

    }
    return new AddAcountStub();
};

const makeEmailValidator = () => {
    class EmailValidatorStub implements EmailValidator {
        isValid(email: string): boolean {
            return true;
        }
    }

    return new EmailValidatorStub();
};

const makeSUT = () => {
    const emailValidatorStub = makeEmailValidator();
    const addAcountStub = makeAddAccount();

    const sut = new SignUpController(emailValidatorStub, addAcountStub);
    return { sut, emailValidatorStub, addAcountStub };
};

describe('controller:signup', () => {

    test('should returns 400 if no name is provided', async () => {
        const { sut } = makeSUT();
        const httpRequest: HttpRequest = {
            body: {
                // name: 'John Doe',
                email: 'johndoe@gmail.com',
                password: 'qwe123',
                confirmPassword: 'qwe123'
            }
        };
        const httpResponse = await sut.handle(httpRequest);
        expect(httpResponse.statusCode).toBe(400);
        expect(httpResponse.body).toEqual(new MissingParamError('name'));
    });


    test('should returns 400 if no email is provided', async () => {
        const { sut } = makeSUT();
        const httpRequest: HttpRequest = {
            body: {
                name: 'John Doe',
                // email: 'johndoe@gmail.com',
                password: 'qwe123',
                confirmPassword: 'qwe123'
            }
        };
        const httpResponse = await sut.handle(httpRequest);
        expect(httpResponse.statusCode).toBe(400);
        expect(httpResponse.body).toEqual(new MissingParamError('email'));
    });

    test('should returns 400 if invalid email is provided', async () => {
        const { sut, emailValidatorStub } = makeSUT();
        vitest.spyOn(emailValidatorStub, 'isValid').mockReturnValueOnce(false);

        const httpRequest: HttpRequest = {
            body: {
                name: 'John Doe',
                email: '--invalid--',
                password: 'qwe123',
                confirmPassword: 'qwe123'
            }
        };
        const httpResponse = await sut.handle(httpRequest);
        expect(httpResponse.statusCode).toBe(400);
        expect(httpResponse.body).toEqual(new InvalidParamError('email'));
    });

    test('should call EmailValidator with correct email', async () => {
        const { sut, emailValidatorStub } = makeSUT();
        const emailValidatorSpy = vitest.spyOn(emailValidatorStub, 'isValid');

        const httpRequest: HttpRequest = {
            body: {
                name: 'John Doe',
                email: 'johndoe@gamil.com',
                password: 'qwe123',
                confirmPassword: 'qwe123'
            }
        };

        sut.handle(httpRequest);
        expect(emailValidatorSpy).toBeCalledWith(httpRequest.body.email);
    });

    test('should returns 400 if no password is provided', async () => {
        const { sut } = makeSUT();
        const httpRequest: HttpRequest = {
            body: {
                name: 'John Doe',
                email: 'johndoe@gmail.com',
                // password: 'qwe123',
                confirmPassword: 'qwe123'
            }
        };
        const httpResponse = await sut.handle(httpRequest);
        expect(httpResponse.statusCode).toBe(400);
        expect(httpResponse.body).toEqual(new MissingParamError('password'));
    });

    test('should returns 400 if no confirm password is provided', async () => {
        const { sut } = makeSUT();
        const httpRequest: HttpRequest = {
            body: {
                name: 'John Doe',
                email: 'johndoe@gmail.com',
                password: 'qwe123',
                // confirmPassword: 'qwe123'
            }
        };
        const httpResponse = await sut.handle(httpRequest);
        expect(httpResponse.statusCode).toBe(400);
        expect(httpResponse.body).toEqual(new MissingParamError('confirmPassword'));
    });

    test('should returns 400 if confirm password not equal password', async () => {
        const { sut } = makeSUT();
        const httpRequest: HttpRequest = {
            body: {
                name: 'John Doe',
                email: 'johndoe@gmail.com',
                password: 'qwe123',
                confirmPassword: '--invalid--'
            }
        };
        const httpResponse = await sut.handle(httpRequest);
        expect(httpResponse.statusCode).toBe(400);
        expect(httpResponse.body).toEqual(new InvalidParamError('confirmPassword'));
    });


    test('should to have been called with correct object', async () => {
        const { sut, addAcountStub } = makeSUT();
        const addAcountSpy = vitest.spyOn(addAcountStub, 'run');

        const httpRequest: HttpRequest = {
            body: {
                name: 'John Doe',
                email: 'johndoe@gmail.com',
                password: 'qwe123',
                confirmPassword: 'qwe123'
            }
        };
        sut.handle(httpRequest);
        expect(addAcountSpy).toHaveBeenCalledWith({
            name: httpRequest.body.name,
            email: httpRequest.body.email,
            password: httpRequest.body.password,
        });

    });

    test('should returns 500 if EmailValidator throws',async () => {
        const { sut, emailValidatorStub } = makeSUT();
        vitest.spyOn(emailValidatorStub, 'isValid').mockImplementationOnce(() => {
            throw new Error('--error--');
        });

        const httpRequest: HttpRequest = {
            body: {
                name: 'John Doe',
                email: 'johndoe@gmail.com',
                password: 'qwe123',
                confirmPassword: 'qwe123'
            }
        };
        const httpResponse = await sut.handle(httpRequest);
        expect(httpResponse.statusCode).toBe(500);
    });

    test('should returns 500 if EmailValidator throws', async () => {
        const { sut, addAcountStub } = makeSUT();
        vitest.spyOn(addAcountStub, 'run').mockImplementationOnce(() => {
            throw new Error('--error--');
        });

        const httpRequest: HttpRequest = {
            body: {
                name: 'John Doe',
                email: 'johndoe@gmail.com',
                password: 'qwe123',
                confirmPassword: 'qwe123'
            }
        };
        const httpResponse = await sut.handle(httpRequest);
        expect(httpResponse.statusCode).toBe(500);
    });

    test('should returns 200 if valid data is provided', async () => {
        const { sut } = makeSUT();

        const httpRequest: HttpRequest = {
            body: {
                name: 'John Doe',
                email: 'johndoe@gmail.com',
                password: 'qwe123',
                confirmPassword: 'qwe123'
            }
        };
        const httpResponse = await sut.handle(httpRequest);
        expect(httpResponse.statusCode).toBe(200);
        expect(httpResponse.body).toEqual({
            id: '$id-valido',
            name: 'John Doe',
            email: 'johndoe@gmail.com',
            password: 'qwe123'
        });
    });

});