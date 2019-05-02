const _ = require('lodash');
const Command = require('../../Command');
const createRoot = require('../root/create.cmd');
const Logic = require('./annotation.logic');

const command = new Command({
    parent: createRoot,
    command: 'annotation <entity-type> <entity-id>',
    description: 'Annotate a resource with labels',
    webDocs: {
        category: 'Annotations',
        title: 'create',
        // weight: 50,
    },
    builder: yargs => yargs
        .positional('entity-type', {
            describe: 'Type of resource for annotation',
            required: true,
        })
        .positional('entity-id', {
            describe: 'Id of resource for annotation',
            required: true,
        })
        .example('codefresh create annotation image 2dfacdaad466 coverage=75%', 'Annotate entity with a single label')
        .example('codefresh create annotation image 2dfacdaad466 coverage=75% tests_passed=true', 'Annotate entity with multiple labels'),
    handler: async (argv) => {
        const { 'entity-type': entityType, 'entity-id': entityId } = argv;
        const labels = argv._.slice(2);

        await Logic.createAnnotations({ entityId, entityType, labels });
        console.log('Annotations was created');
    },
});

module.exports = command;