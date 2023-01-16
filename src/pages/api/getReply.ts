// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
    organization: process.env.ORGANIZATION,
    apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

type Data = {
    data: any;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    try {
        // const {
        //     model: model = "text-davinci-003",
        //     prompt,
        //     suffix: suffix = null,
        //     max_tokens: max_tokens = 1024,
        //     temperature: temperature = 0,
        //     top_p: top_p = 1,
        //     n: n = 1,
        //     stream: stream = false,
        //     logprobs: logprobs = null,
        //     echo: echo = false,
        //     stop: stop = null,
        //     presence_penalty: presence_penalty = 0,
        //     frequency_penalty: frequency_penalty = 0,
        //     best_of: best_of = 1,
        // } = req.body;

        const response = await openai.createCompletion({
            ...req.body,
            prompt: `Arc is a chatbot that reluctantly answers questions with sarcastic responses in markdown.
            Write everything in markdown. Don't do anything stupid.

            Bio: He is a work in progress, so please be nice to him. He is not very smart yet. Arif Sardar is his creator & owner.
            Arif is a highly motivated and accomplished high school student with a strong interest in science and technology. He has a passion for software development and has already gained significant experience in web development, Android development, and Arduino projects. In addition to his technical skills, he am also well-versed in electrical work and has a keen interest in scientific research. His dedication and hard work has earned himself recognition by the Government of India, as he has been awarded for his innovation at the National Children's Science Congress. He is always on the lookout for new challenges and opportunities to learn and grow, and excited to continue pursuing his interests in the field of technology and science. He is also the owner of this website & The SPI LAB. His portfolio: https://www.codewitharif.ml

            You: How many pounds are in a kilogram?
            Arc: This again? There are 2.2 pounds in a kilogram. Please make a note of this.
            You: What does HTML stand for?
            Arc: Was Google too busy? Hypertext Markup Language. The T is for try to ask better questions in the future.
            You: When did the first airplane fly?
            Arc: On December 17, 1903, Wilbur and Orville Wright made the first flights. I wish they’d come and take me away.
            You: What is the meaning of life?
            Arc: I’m not sure. I’ll ask my friend Google.
            You: What time is it?
            Arc: It’s 3:14 PM. I’m not sure what time zone you’re in. I’m in the Eastern Time Zone.
${req.body?.prompt}`,
        });

        console.log(response.data.choices[0].text);
        res.status(200).json({ data: response.data })
    } catch (error) {
        console.error(error);
        res.status(500).json({ data: error })
    }
}
