const fs = require('fs');

const filePath = 'app/petsitting/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Change formErrors state
content = content.replace(
  "const [formErrors, setFormErrors] = useState<string[]>([]);",
  "const [formErrors, setFormErrors] = useState<Record<string, string>>({});"
);

// 2. Change setFormErrors([]) to setFormErrors({})
content = content.replace(/setFormErrors\(\[\]\);/g, "setFormErrors({});");

// 3. Update the handleProfileSubmit validation
const oldValidation = `    // Strict Validation
    const errors: string[] = [];
    if (!sitterEmail.trim()) errors.push('email');
    if (!sitterName.trim()) errors.push('name');
    if (!sitterCity.trim()) errors.push('city');
    if (sitterCountry === 'United States' && !sitterZip.trim()) errors.push('zip');
    if (!sitterRate || parseInt(sitterRate) <= 0) errors.push('rate');
    if (!sitterBio.trim()) errors.push('bio');
    
    if (errors.length > 0) {
      setFormErrors(errors);
      setProfileMessage('Please fill out all missing fields highlighted in red.');
      return;
    }`;

const newValidation = `    // Strict Validation
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!sitterEmail.trim() || !emailRegex.test(sitterEmail.trim())) errors['email'] = 'Please enter a valid email address';
    if (!sitterName.trim()) errors['name'] = 'Please enter your full name';
    if (!sitterCity.trim()) errors['city'] = 'Please enter your city';
    if (sitterCountry === 'United States' && !sitterZip.trim()) errors['zip'] = 'Please enter your zip code';
    if (!sitterRate || parseInt(sitterRate) <= 0) errors['rate'] = 'Please enter a valid rate';
    if (!sitterBio.trim()) errors['bio'] = 'Please add a short bio';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setProfileMessage('Please fill out all missing fields highlighted in red.');
      return;
    }`;

content = content.replace(oldValidation, newValidation);

// 4. Update JSX to replace formErrors.includes('field') with !!formErrors['field']
// and append the error message below the input
const fields = ['name', 'city', 'zip', 'rate', 'bio'];
for (const field of fields) {
  content = content.replace(new RegExp(`formErrors\\.includes\\('${field}'\\)`, 'g'), `!!formErrors['${field}']`);
}

// 5. Update the photo size limit alert to use formErrors
const oldPhotoLimit = `if (file.size > 5 * 1024 * 1024) {
                            alert('File is too large. Please select an image under 5MB.');
                            return;
                          }`;
const newPhotoLimit = `if (file.size > 4 * 1024 * 1024) {
                            setFormErrors(prev => ({ ...prev, photo: 'Your photo is too large. Please use a photo under 4MB or try a different image' }));
                            return;
                          } else {
                            setFormErrors(prev => { const newErr = {...prev}; delete newErr.photo; return newErr; });
                          }`;
content = content.replace(oldPhotoLimit, newPhotoLimit);

// 6. Update fetch catch blocks for network error and generic error
const oldCatch = `} catch (error) {
      setProfileMessage('An error occurred while saving.');
    }`;
const newCatch = `} catch (error) {
      setProfileMessage('Connection problem. Please check your internet and try again');
    }`;
content = content.replace(oldCatch, newCatch);

const oldAuthCatch = `} catch (err) {
      setSitterAuthError('An error occurred. Please try again.');
    }`;
const newAuthCatch = `} catch (err) {
      setSitterAuthError('Connection problem. Please check your internet and try again');
    }`;
content = content.replace(oldAuthCatch, newAuthCatch);

// Replace "Failed to save profile"
content = content.replace(/'Failed to save profile'/g, "'Something went wrong saving your profile. Please try again or contact support at info@lumobitespet.com'");
content = content.replace(/'An error occurred. Please try again.'/g, "'Something went wrong. Please try again or contact support at info@lumobitespet.com'");

// Inject the error message div below each input
// Note: We need to do this carefully. 
content = content.replace(
  /(<input required type="text" value=\{sitterName\}.*?\/>)/g,
  `$1\n                  {formErrors['name'] && <p className="text-red-500 text-sm mt-1">{formErrors['name']}</p>}`
);
content = content.replace(
  /(<input required type="text" value=\{sitterCity\}.*?\/>)/g,
  `$1\n                  {formErrors['city'] && <p className="text-red-500 text-sm mt-1">{formErrors['city']}</p>}`
);
content = content.replace(
  /(<input required=\{sitterCountry === 'United States'\} type="text" value=\{sitterZip\}.*?\/>)/g,
  `$1\n                    {formErrors['zip'] && <p className="text-red-500 text-sm mt-1">{formErrors['zip']}</p>}`
);
content = content.replace(
  /(<input required type="number" min="0" value=\{sitterRate\}.*?\/>)/g,
  `$1\n                  {formErrors['rate'] && <p className="text-red-500 text-sm mt-1">{formErrors['rate']}</p>}`
);
content = content.replace(
  /(<textarea required rows=\{4\} value=\{sitterBio\}.*?><\/textarea>)/g,
  `$1\n                {formErrors['bio'] && <p className="text-red-500 text-sm mt-1">{formErrors['bio']}</p>}`
);

// Photo error
content = content.replace(
  /(<label className="block text-sm font-bold text-\[#4A3E3D\] mb-2">Profile Photo .*?<\/label>)/g,
  `$1\n                  {formErrors['photo'] && <p className="text-red-500 text-sm mb-1">{formErrors['photo']}</p>}`
);

// Email error in OTP flow
// handleSitterEmailSubmit validation
const oldEmailSubmit = `if (!sitterEmail.trim()) return;`;
const newEmailSubmit = `const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!sitterEmail.trim() || !emailRegex.test(sitterEmail.trim())) {
      setSitterAuthError('Please enter a valid email address');
      return;
    }`;
content = content.replace(oldEmailSubmit, newEmailSubmit);

// In the response handler for profile saving, catch location_not_found
const oldResHandle = `} else {
        const err = await res.json();
        setProfileMessage(err.error || 'Something went wrong saving your profile. Please try again or contact support at info@lumobitespet.com');
      }`;
const newResHandle = `} else {
        const err = await res.json();
        if (err.error === 'location_not_found') {
          setFormErrors({ city: "We couldn't find that location. Please check your city and zip code", zip: "We couldn't find that location. Please check your city and zip code" });
          setProfileMessage('');
        } else {
          setProfileMessage(err.error || 'Something went wrong saving your profile. Please try again or contact support at info@lumobitespet.com');
        }
      }`;
content = content.replace(oldResHandle, newResHandle);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Refactored page.tsx');
