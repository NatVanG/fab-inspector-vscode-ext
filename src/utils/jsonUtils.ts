/**
 * Recursively search for objects with a specific property value in a JSON object
 */
function findObjectsWithProperty(obj: any, propertyName: string, propertyValue: string): any[] {
    const results: any[] = [];
    
    function search(current: any): void {
        if (current && typeof current === 'object') {
            // Check if current object has the property with matching value
            if (current[propertyName] === propertyValue) {
                results.push(current);
            }
            
            // Recursively search in all properties
            for (const key in current) {
                if (current.hasOwnProperty(key)) {
                    search(current[key]);
                }
            }
        } else if (Array.isArray(current)) {
            // If it's an array, search each element
            current.forEach(item => search(item));
        }
    }
    
    search(obj);
    return results;
}

/**
 * Function to find a rule by its ID in the document text
 */
export function findRuleById(documentText: string, ruleId: string): any | null {
    try {
        // Parse the document as JSON
        const documentJson = JSON.parse(documentText);
        
        // First, try to find in a rules array specifically
        if (documentJson.rules && Array.isArray(documentJson.rules)) {
            const ruleMatch = documentJson.rules.find((rule: any) => rule.id === ruleId);
            if (ruleMatch) {
                return ruleMatch;
            }
        }
        
        // If not found in rules array, search recursively through the entire document
        const matches = findObjectsWithProperty(documentJson, 'id', ruleId);
        
        if (matches.length > 0) {
            return matches[0]; // Return the first match
        }
        
        return null;
        
    } catch (error) {
        console.log('Document is not valid JSON, cannot search for rule by ID');
        return null;
    }
}
