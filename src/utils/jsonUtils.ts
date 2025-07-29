const jsonpath = require('jsonpath');

/**
 * Function to find a rule by its ID in the document text
 */
export function findRuleById(documentText: string, ruleId: string): any | null {
    try {
        // Parse the document as JSON
        const documentJson = JSON.parse(documentText);
        
        // Use JsonPath to find rules with the matching ID
        // This will search for any object with an "id" property matching ruleId
        const matches = jsonpath.query(documentJson, `$..rules[?(@.id == "${ruleId}")]`);
        
        if (matches.length > 0) {
            return matches[0]; // Return the first match
        }
        
        // If no match found in rules array, try searching anywhere in the document
        const globalMatches = jsonpath.query(documentJson, `$..[?(@.id == "${ruleId}")]`);
        
        if (globalMatches.length > 0) {
            return globalMatches[0]; // Return the first match
        }
        
        return null;
        
    } catch (error) {
        console.log('Document is not valid JSON, cannot search for rule by ID');
        return null;
    }
}
