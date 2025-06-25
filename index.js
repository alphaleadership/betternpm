const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const pacote = require('pacote');
async function extractModule(moduleName,version="latest") {
    try {
      // Extraire le nom du package du moduleName
      const packageName = moduleName
      
      // Créer le chemin du sous-dossier dans node_modules
      const targetDir = path.join(process.cwd(), 'node_modules', packageName);
      
      // Vérifier si le module existe déjà
      if (fs.existsSync(targetDir)) {
        console.log(`Le module ${packageName} existe déjà dans ${targetDir}`);
        return { from: moduleName, resolved: targetDir, integrity: 'existing' };
      }
      
      // Créer le dossier
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`install ${moduleName}`)
      // Extraire le module dans le sous-dossier
      const result = await pacote.extract(moduleName+"@"+version, targetDir);
      
      // Lire le package.json pour obtenir les dépendances
      const packageJsonPath = path.join(targetDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Extraire les dépendances
        const dependencies = {
          ...packageJson.dependencies
        };
        
        // Extraire récursivement les dépendances
        for (const [depName, depVersion] of Object.entries(dependencies)) {
          try {
            await extractModule(depName,depVersion);
          } catch (depError) {
            console.warn(`Impossible d'extraire la dépendance ${depName}: ${depError.message}`);
          }
        }
      }
      
      console.log(`Module extrait avec succès dans ${targetDir}`);
      console.log(`Source: ${result.from}`);
      console.log(`Chemin résolu: ${result.resolved}`);
      console.log(`Intégrité: ${result.integrity}`);
      
      return result;
    } catch (error) {
      console.error(`Erreur lors de l'extraction du module: ${error.message}`);
      throw error;
    }
  }
// Configuration du programme CLI
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
                            let dependencies=JSON.parse(t).dependencies.concat(JSON.parse(t).devDependencies);
                            for(let i in dependencies){
                                items.push(i);
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
