# Recorded rights and privacy checks

Checked 20 October 2026. The base targets a trusted NZ brand operator. These checks identify incomplete records; they do not interpret a licence, certify compliance or grant permission. Australian deployments need their own reviewed rules.

| Check | Source and rule | Implementation |
|---|---|---|
| NZ-COPYRIGHT | [IPONZ: getting permission](https://www.iponz.govt.nz/get-ip/copyright/getting-permission/) explains permission from the owner or an authorised party and keeping a written record. Credit alone is not permission. | Active assets with no current, unrevoked permission are flagged. Each recorded permission needs a licensor, evidence reference, exact channel, territory, purpose and dates. The operator checks the actual document and any exceptions. |
| LICENCE-SCOPE | [IPONZ: getting permission](https://www.iponz.govt.nz/get-ip/copyright/getting-permission/) says uses outside the scope of a licence need permission. | Planned use is rejected if the stored dates, purpose, channel or territory do not fit. Current placements are rechecked after withdrawal or revocation. No automatic interpretation of free-text licence terms. |
| NZ-PRIVACY-9 | [Office of the Privacy Commissioner: principle 9](https://www.privacy.org.nz/privacy-principles/9/) limits retention to the period necessary for lawful purposes. | Unknown personal-information scope is flagged. Assets containing personal information need a recorded lawful purpose and review date. Missing or overdue review dates are flagged. A review date is an internal control, not a statutory retention period. |

Activation means the metadata was reviewed. It does not approve a use. Imported licence names remain labels until a permission with evidence is recorded. File references and evidence references are recorded locations, not a proof that the file exists or the evidence is legally sufficient. No faces are identified and no files are fetched.

A planned campaign involving personal information requires a review date covering the planned end date. The operator decides the lawful purpose, exact permission scope, whether additional consent is needed and any legal exceptions. The base deliberately has no automatic deletion. Record a follow-up for an authorised person to carry out disposal in the actual storage system. Archived records and exported copies still need retention management outside the automated review.

Actor names are operator-supplied labels, not verified identities. This is one trusted operator per private database. RLS denies public access; no end-user policies or authentication service are supplied. The database owner can bypass controls and must be trusted.
