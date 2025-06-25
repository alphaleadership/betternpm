
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
module.exports = extractModule;