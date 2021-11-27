import React from 'react';
import {
  useSearchParams,
  Link,
  LinksFunction,
  Form,
  ActionFunction,
  useActionData,
} from 'remix';
import { z } from 'zod';
import { ActionData } from '~/types/ActionData';
import { db } from '~/utils/db.sever';
import {
  createUserSession,
  login,
  LoginForm,
  register,
} from '~/utils/session.server';
import stylesUrl from '../styles/login.css';

const loginTypes = ['login', 'register'] as const;
const boolSchema = z.enum(loginTypes);
type LoginType = z.infer<typeof boolSchema>;
type Data = ActionData<LoginForm & { loginType?: LoginType }>;

export let links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: stylesUrl }];
};

export const action: ActionFunction = async ({
  request,
}): Promise<Response | Data> => {
  const form = await request.formData();
  const [username, password, loginType] = [
    form.get('username'),
    form.get('password'),
    form.get('loginType'),
  ];

  const schema = z.object({
    username: z
      .string()
      .min(3, 'Username is too short.')
      .max(20, 'Username is too long'),
    password: z
      .string()
      .min(3, 'Password is too short.')
      .max(100, 'Password is too long'),
  });

  const type = boolSchema.parse(loginType);
  const redirectTo = z.string().safeParse(form.get('redirectTo'));

  const userSchema = schema.safeParse({
    username,
    password,
  });

  if (userSchema.success) {
    const data = {
      username: userSchema.data.username,
      password: userSchema.data.password,
    };
    let user = null;
    if (type === 'register') {
      const userExists = await db.user.count({
        where: { username: userSchema.data.username },
      });
      if (userExists) {
        return {
          fields: data,
          formError: [`Username ${userSchema.data.username} already exists.`],
        };
      }

      user = await register(data);
    }

    if (type === 'login') {
      user = await login(data);
    }
    if (!user) {
      return { fields: data, formError: ['Invalid username or password'] };
    }
    return createUserSession(
      user.id,
      (redirectTo.success && redirectTo.data) || '/jokes'
    );
  } else {
    const error = userSchema.error.flatten();

    return { ...error };
  }
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<Data>();
  return (
    <div className="container">
      <div className="content" data-light="">
        <h1>Login</h1>
        <Form
          method="post"
          aria-describedby={actionData?.formError ? 'form-error-message' : undefined}
        >
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get('redirectTo') ?? undefined}
          />
          <fieldset>
            <legend className="sr-only">Login or Register?</legend>
            {loginTypes.map((type) => (
              <label key={type}>
                <input
                  type="radio"
                  name="loginType"
                  value={type}
                  defaultChecked={type === 'login'}
                />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            ))}
          </fieldset>
          <div>
            <label htmlFor="username-input">Username</label>
            <input
              type="text"
              id="username-input"
              name="username"
              defaultValue={actionData?.fields?.username}
              aria-invalid={Boolean(actionData?.fieldErrors?.username)}
              aria-describedby={
                actionData?.fieldErrors?.username?.join(', ')
                  ? 'username-error'
                  : undefined
              }
            />
            {actionData?.fieldErrors?.username?.length ? (
              <p className="form-validation-error" role="alert" id="username-error">
                {actionData?.fieldErrors.username.join(', ')}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              name="password"
              defaultValue={actionData?.fields?.password}
              type="password"
              aria-invalid={Boolean(actionData?.fieldErrors?.password) || undefined}
              aria-describedby={
                actionData?.fieldErrors?.password?.join(', ')
                  ? 'password-error'
                  : undefined
              }
            />
            {actionData?.fieldErrors?.password?.length ? (
              <p className="form-validation-error" role="alert" id="password-error">
                {actionData?.fieldErrors.password.join(', ')}
              </p>
            ) : null}
          </div>
          <div id="form-error-message">
            {actionData?.formError?.length ? (
              <p className="form-validation-error" role="alert">
                {actionData?.formError.join(', ')}
              </p>
            ) : null}
          </div>
          <button type="submit" className="button">
            Submit
          </button>
        </Form>
      </div>
      <div className="links">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/jokes">Jokes</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
