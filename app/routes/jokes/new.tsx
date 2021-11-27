import { ActionFunction, Form, redirect, useActionData } from 'remix';
import { strictObject, z } from 'zod';
import { ActionData } from '~/types/ActionData';
import { db } from '~/utils/db.sever';
import { requireUserId } from '~/utils/session.server';

type Data = ActionData<{ name: string; content: string }>;

export const action: ActionFunction = async ({
  request,
}): Promise<Response | Data> => {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const [name, content] = [form.get('name'), form.get('content')];

  const jokeSchema = z.object({
    name: z.string().min(3, 'Joke name is too short.'),
    content: z.string().min(10, 'Joke content is too short'),
  });

  const schema = jokeSchema.safeParse({
    name: name,
    content: content,
  });

  if (schema.success) {
    const joke = await db.joke.create({
      data: { ...schema.data, jokesterId: userId },
    });
    return redirect(`/jokes/${joke.id}`);
  } else {
    const error = schema.error.flatten();

    return { ...error };
  }
};

export default function NewJokeRoute() {
  const actionData = useActionData<Data | undefined>();

  return (
    <div>
      <p>Add your own hilarious joke</p>
      <Form method="post">
        <div>
          <label>
            Name:{' '}
            <input
              type="text"
              defaultValue={actionData?.fields?.name}
              name="name"
              aria-invalid={Boolean(actionData?.fieldErrors?.name) || undefined}
              aria-describedby={
                actionData?.fieldErrors?.name?.join(', ') ? 'name-error' : undefined
              }
            />
          </label>
          {actionData?.fieldErrors?.name?.length ? (
            <p className="form-validation-error" role="alert" id="name-error">
              {actionData?.fieldErrors?.name?.join(', ')}
            </p>
          ) : null}
        </div>
        <div>
          <label>
            Content:{' '}
            <textarea
              defaultValue={actionData?.fields?.content}
              name="content"
              aria-invalid={Boolean(actionData?.fieldErrors?.content) || undefined}
              aria-describedby={
                actionData?.fieldErrors?.content?.join(', ')
                  ? 'content-error'
                  : undefined
              }
            />
          </label>
          {actionData?.fieldErrors?.content?.length ? (
            <p className="form-validation-error" role="alert" id="content-error">
              {actionData.fieldErrors.content.join(', ')}
            </p>
          ) : null}
        </div>
        <div>
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </Form>
    </div>
  );
}
