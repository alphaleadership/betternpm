const { program } = require('commander');
const extractModule = require('./index');
const fs = require('fs');
const path = require('path');

program
    .name('cli-tool')
    .description('Outil CLI pour gérer des arguments')
    .version('1.0.0');

// Options communes
program
    .option('-v, --verbose', 'Mode verbeux')
    .option('-f, --file <file>', 'Fichier à traiter')
    .option('-c, --config <path>', 'Chemin vers le fichier de configuration')
    .option('--debug', 'Activer le mode debug');

// Commande principale
program
    .command('install <items...>')
    .description('Traiter une liste d\'arguments')
    .action((items, options) => {
        if (options.verbose) {
            console.log('Arguments reçus:', items);
            console.log('Options:', options);
        }
        
        // Logique de traitement
        console.log(`\nTraitement de ${items.length} éléments:`);
        items.forEach((item, index) => {
            console.log(`${index + 1}. ${item}`);
            extractModule(item.split("@")[0],item.split("@")[1]);
        });
        
    })
    program.command('uninstall <items...>')
    .description('Traiter une liste d\'arguments')
    .action((items, options) => {
        if (options.verbose) {
            console.log('Arguments reçus:', items);
            console.log('Options:', options);
        }
        
        // Logique de traitement
        console.log(`\nTraitement de ${items.length} éléments:`);
        items.forEach((item, index) => {
            console.log(`${index + 1}. ${item}`);
            fs.readdir(path.join(process.cwd(), 'node_modules', item), (err, files) => {
                if (err) {
                    console.error(`Impossible de lire le dossier ${item}: ${err.message}`);
                } else {
                    console.log(`Dossier ${item} contient ${files.length} fichiers`);
                    files.forEach((file, index) => {
                        console.log(`${index + 1}. ${file}`);
                        if(file==="package.json"){
                            let t=fs.readFileSync(path.join(process.cwd(), 'node_modules', item, file), 'utf8');
                            if(JSON.parse(t).dependencies){
                                let dependencies=JSON.parse(t).dependencies;
                                for(let i in dependencies){
                                    items.push(i);
                                }
                            }
                            if(JSON.parse(t).devDependencies){
                                let dependencies=JSON.parse(t).devDependencies;
                                for(let i in dependencies){
                                    items.push(i);
                                }
                            }
                        }
                        if(fs.statSync(path.join(process.cwd(), 'node_modules', item, file)).isDirectory()) {
                            console.log(`Suppression du dossier ${file}`);
                            if(fs.readdirSync(path.join(process.cwd(    ), 'node_modules', item, file)).length === 0) {
                                fs.rmdirSync(path.join(process.cwd(), 'node_modules', item, file));
                            }else{
                                fs.rmdirSync(path.join(process.cwd(), 'node_modules', item, file), { recursive: true });
                            }
                        }
                        fs.unlink(path.join(process.cwd(), 'node_modules', item, file), (err) => {
                            if (err) {
                                console.error(`Impossible de supprimer le fichier ${file}: ${err.message}`);
                            } else {
                                console.log(`Fichier ${file} supprimé avec succès`);
                            }
                        });
                    });
                }
            });
        });
        
    });

// Gestion des erreurs
program.on('command:*', () => {
    console.error('Commande invalide. Utilisez --help pour voir les options disponibles.');
});

// Affichage de l'aide si aucun argument n'est fourni
if (process.argv.length < 3) {
    program.help();
}

// Exécution du programme
program.parse();
