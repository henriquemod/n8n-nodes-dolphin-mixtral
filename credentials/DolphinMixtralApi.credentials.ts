import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DolphinMixtralApi implements ICredentialType {
	name = 'dolphinMixtralApi';
	displayName = 'Dolphin Mixtral API';
	properties: INodeProperties[] = [
		{
			displayName: 'API URL',
			name: 'apiUrl',
			type: 'string',
			default: 'http://localhost:11434',
			required: true,
		},
		{
			displayName: 'Model Name',
			name: 'model',
			type: 'string',
			default: 'dolphin-mixtral:latest',
			required: true,
		},
	];
}