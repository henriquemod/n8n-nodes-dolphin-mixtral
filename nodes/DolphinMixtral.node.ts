import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, NodeOperationError, NodeConnectionType } from 'n8n-workflow';

export class DolphinMixtral implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Dolphin Mixtral',
        name: 'dolphinMixtral',
        icon: 'file:ollama.svg',
        group: ['transform'],
        version: 1,
        description: 'Execute local Dolphin Mixtral models',
        defaults: {
            name: 'Dolphin Mixtral',
        },
        inputs: [
            {
                type: NodeConnectionType.Main,
                displayName: 'Input',
            },
        ],
        outputs: [
            {
                type: NodeConnectionType.Main,
                displayName: 'Output',
            },
        ],
        credentials: [
            {
                name: 'dolphinMixtralApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Model Name',
                description: 'Choose which model to use',
                required: true,
                name: 'model',
                type: 'options',
                default: 'dolphin-mixtral:latest',
                options: [
                    { name: 'Dolphin Mixtral', value: 'dolphin-mixtral:latest' },
                ]
            },
            {
                displayName: 'Prompt',
                name: 'prompt',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                default: '',
                description: 'The prompt to send to the model',
                required: true,
            },
            {
                displayName: 'Options',
                name: 'options',
                type: 'collection',
                placeholder: 'Add Option',
                default: {},
                options: [
                    {
                        displayName: 'System Prompt',
                        name: 'systemPrompt',
                        type: 'string',
                        default: 'You are Dolphin, a helpful AI assistant.',
                        description: 'The system prompt that defines the AI behavior',
                        typeOptions: {
                            rows: 4,
                        },
                    },
                    {
                        displayName: 'Temperature',
                        name: 'temperature',
                        type: 'number',
                        default: 0.7,
                        description: 'The sampling temperature to use',
                        typeOptions: {
                            minValue: 0,
                            maxValue: 2,
                        },
                    },
                    {
                        displayName: 'Max Tokens',
                        name: 'maxTokens',
                        type: 'number',
                        default: 2048,
                        description: 'Maximum number of tokens to generate',
                    },
                ],
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        const credentials = await this.getCredentials('dolphinMixtralApi');

        for (let i = 0; i < items.length; i++) {
            const model = this.getNodeParameter('model', i) as string;
            const prompt = this.getNodeParameter('prompt', i) as string;
            const options = this.getNodeParameter('options', i) as {
                systemPrompt?: string;
                temperature?: number;
                maxTokens?: number;
            };

            try {
                // Format the prompt according to ChatML format
                const formattedPrompt = `<|im_start|>system
${options.systemPrompt || 'You are Dolphin, a helpful AI assistant.'}<|im_end|>
<|im_start|>user
${prompt}<|im_end|>
<|im_start|>assistant
`;

                // Make HTTP request to local Ollama instance
                const response = await this.helpers.request({
                    method: 'POST',
                    url: `${credentials.apiUrl}/api/generate`,
                    body: {
                        model,
                        prompt: formattedPrompt,
                        temperature: options.temperature,
                        max_tokens: options.maxTokens,
                        stream: false, // Ensure we get a complete response
                    },
                    json: true,
                });

                // Process the response
                returnData.push({
                    json: {
                        response: response.response, // The generated text
                        model,
                        input: prompt,
                        metadata: {
                            total_duration: response.total_duration,
                            load_duration: response.load_duration,
                            sample_count: response.sample_count,
                            sample_duration: response.sample_duration,
                            prompt_eval_count: response.prompt_eval_count,
                            prompt_eval_duration: response.prompt_eval_duration,
                            eval_count: response.eval_count,
                            eval_duration: response.eval_duration,
                        }
                    },
                });
            } catch (error) {
                throw new NodeOperationError(
                    this.getNode(),
                    `Dolphin Mixtral error: ${error.message}`,
                    { itemIndex: i }
                );
            }
        }

        return [returnData];
    }
} 