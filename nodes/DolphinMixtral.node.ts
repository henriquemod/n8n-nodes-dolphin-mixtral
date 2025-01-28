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
                        displayName: 'Temperature',
                        name: 'temperature',
                        type: 'number',
                        default: 0.7,
                        description: 'The sampling temperature to use',
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
                temperature?: number;
                maxTokens?: number;
            };

            try {
                // Make HTTP request to local Ollama instance
                const response = await this.helpers.request({
                    method: 'POST',
                    url: `${credentials.apiUrl}/api/generate`,
                    body: {
                        model,
                        prompt,
                        temperature: options.temperature,
                        max_tokens: options.maxTokens,
                    },
                    json: true,
                });

                returnData.push({
                    json: {
                        response: response.response,
                        model: model,
                        prompt: prompt,
                        ...response, // Include full response data
                    },
                });
            } catch (error) {
                throw new NodeOperationError(this.getNode(), `Dolphin Mixtral error: ${error.message}`);
            }
        }

        return [returnData];
    }
} 