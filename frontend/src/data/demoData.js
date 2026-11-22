// Demo data for two sample cases

export const demoCase1 = {
  caseForm: {
    draft_type: 'Legal Notice',
    case_type: 'cheque_bounce',
    client_name: 'Adv. Ramesh Patil',
    client_address: 'Office No. 12, Advocate Chambers, District Court, Pune – 411001',
    opp_name: 'Suresh Sharma',
    opp_address: 'Flat 304, Shanti Niwas, Pimpri Colony, Pune – 411018',
    key_facts:
      'The opposite party issued a cheque bearing No. 004521 dated 10-Sep-2024 for Rs. 2,50,000/- drawn on HDFC Bank, Pimpri Branch in favour of the client towards repayment of a loan. The cheque was presented on 15-Sep-2024 and was returned dishonoured with reason "Insufficient Funds" on 18-Sep-2024. The client sent a demand notice on 25-Sep-2024 which was duly received by the opposite party but no payment has been made.',
    demand: 'Pay Rs. 2,50,000/- with interest at 18% p.a. within 15 days failing which criminal proceedings under Section 138 NI Act shall be initiated.',
    time_limit: 15,
    draft_language: 'English',
  },
  extractedDocs: [
    {
      doc_type: 'cheque',
      filename: 'cheque_004521.jpg',
      fields: {
        person_names: ['Ramesh Patel'],  // mismatch: should be Ramesh Patil
        dates: ['10-Sep-2024'],
        amounts: ['2,50,000'],
        identifiers: { cheque_no: '004521', bank: 'HDFC Bank', branch: 'Pimpri' },
        raw_text: 'Pay Ramesh Patel 2,50,000 HDFC Bank Pimpri 004521',
      },
    },
    {
      doc_type: 'bank_return_memo',
      filename: 'return_memo.jpg',
      fields: {
        person_names: ['Ramesh Patil'],
        dates: ['18-Sep-2024'],
        amounts: ['2,50,000'],
        identifiers: { reason: 'Insufficient Funds' },
        raw_text: 'Cheque 004521 returned - Insufficient Funds - 18-Sep-2024',
      },
    },
    {
      doc_type: 'agreement',
      filename: 'loan_agreement.pdf',
      fields: {
        person_names: ['Ramesh Patil', 'Suresh Sharma'],
        dates: ['01-Jun-2024'],
        amounts: ['2,50,000'],
        identifiers: {},
        // Missing signature flag
        signature_present: false,
        raw_text: 'Loan Agreement between Ramesh Patil and Suresh Sharma dated 01-Jun-2024',
      },
    },
  ],
  checklistItems: [
    {
      status: 'red',
      message: 'Name mismatch: Cheque shows "Ramesh Patel" but client is "Ramesh Patil"',
      doc_ref: 'cheque_004521.jpg',
    },
    {
      status: 'red',
      message: 'Missing signature on loan agreement',
      doc_ref: 'loan_agreement.pdf',
    },
    {
      status: 'green',
      message: 'Bank return memo present and dated correctly',
      doc_ref: 'return_memo.jpg',
    },
    {
      status: 'green',
      message: 'Cheque amount matches agreement amount (Rs. 2,50,000)',
      doc_ref: 'cheque_004521.jpg',
    },
  ],
  draftText: `LEGAL NOTICE

Under instructions from and on behalf of my client Shri Ramesh Patil, resident of Office No. 12, Advocate Chambers, District Court, Pune – 411001, I hereby serve upon you the following legal notice:

1. That my client and you entered into a loan agreement dated 01-Jun-2024 wherein my client advanced a sum of Rs. 2,50,000/- (Rupees Two Lakh Fifty Thousand Only) to you.

2. That towards repayment of the said loan amount, you issued a cheque bearing No. 004521 dated 10-Sep-2024 for Rs. 2,50,000/- drawn on HDFC Bank, Pimpri Branch.

3. That the said cheque was presented for encashment on 15-Sep-2024 and was returned dishonoured on 18-Sep-2024 with the remark "Insufficient Funds" as evidenced by the bank's return memo.

4. That the dishonour of the said cheque constitutes an offence under Section 138 of the Negotiable Instruments Act, 1881.

5. You are therefore called upon to pay the said sum of Rs. 2,50,000/- along with interest at the rate of 18% per annum from the date of dishonour within 15 (fifteen) days from the receipt of this notice.

6. Failing to make payment within the stipulated period, my client shall be compelled to initiate appropriate criminal proceedings under Section 138 of the Negotiable Instruments Act, 1881 and civil proceedings for recovery, entirely at your risk, cost and consequences.

Dated this day of November 2024.

Advocate for the Noticee`,
  clientSummary:
    'आपके मुवक्किल रमेश पाटिल ने सुरेश शर्मा को 2.5 लाख रुपये का कर्ज दिया था। सुरेश ने चेक दिया लेकिन बैंक ने "अपर्याप्त धन" कहकर वापस कर दिया। यह कानूनी नोटिस 15 दिन में पैसे चुकाने की मांग करता है, अन्यथा धारा 138 के तहत आपराधिक मामला दर्ज होगा।',
  suggestedSections: [
    { section: 'Section 138', act: 'Negotiable Instruments Act, 1881', explanation: 'Makes dishonour of a cheque a criminal offence punishable with up to 2 years imprisonment or fine.' },
    { section: 'Section 142', act: 'Negotiable Instruments Act, 1881', explanation: 'Sets the cognizance procedure – complaint must be filed within 30 days of cause of action.' },
    { section: 'Section 80', act: 'Code of Civil Procedure, 1908', explanation: 'Requires serving legal notice before filing civil suit against government bodies.' },
  ],
}

export const demoCase2 = {
  caseForm: {
    draft_type: 'Reply to Notice',
    case_type: 'property_dispute',
    client_name: 'Vijay Kulkarni',
    client_address: 'Survey No. 45, Plot No. 7, Kothrud, Pune – 411038',
    opp_name: 'Prakash Deshmukh',
    opp_address: 'Flat 201, Lotus Apartments, Kothrud, Pune – 411038',
    key_facts:
      'The opposite party has sent a legal notice claiming ownership of Survey No. 45, Plot No. 7, Kothrud, Pune. My client Vijay Kulkarni is the registered owner as per the Sale Deed dated 12-Mar-2019 registered at Sub-Registrar Office, Pune. The 7/12 extract from Talathi office confirms my client\'s name. The opposite party\'s claim is false and frivolous.',
    demand: 'Reply to the false and frivolous notice; reserve right to claim costs and damages for harassment.',
    time_limit: 7,
    draft_language: 'English',
  },
  extractedDocs: [
    {
      doc_type: 'sale_deed',
      filename: 'sale_deed_kulkarni.pdf',
      fields: {
        person_names: ['Vijay Kulkarni', 'Previous Owner'],
        dates: ['12-Mar-2019'],
        amounts: ['45,00,000'],
        identifiers: { survey_no: '45', plot_no: '7', registration: 'SRO Pune' },
        raw_text: 'Sale Deed - Survey No 45 Plot 7 Kothrud Pune - Vijay Kulkarni - 12-Mar-2019',
      },
    },
    {
      doc_type: '712_extract',
      filename: '712_extract_missing.pdf',
      fields: {
        person_names: ['Vijay Kulkarni'],
        // Missing date
        dates: [],
        amounts: [],
        identifiers: { survey_no: '45', plot_no: '7' },
        raw_text: 'Satbara Utara - Survey No 45 - Vijay Kulkarni',
      },
    },
  ],
  checklistItems: [
    {
      status: 'yellow',
      message: 'Missing date on 7/12 extract – obtain certified copy with date from Talathi office',
      doc_ref: '712_extract_missing.pdf',
    },
    {
      status: 'green',
      message: 'Sale deed present and registered – ownership confirmed',
      doc_ref: 'sale_deed_kulkarni.pdf',
    },
    {
      status: 'yellow',
      message: 'Id proof document not uploaded – recommended for complete record',
      doc_ref: null,
    },
  ],
  draftText: `REPLY TO LEGAL NOTICE

In response to the legal notice dated [Date of Notice] received through you on behalf of Shri Prakash Deshmukh, I on behalf of my client Shri Vijay Kulkarni, resident of Survey No. 45, Plot No. 7, Kothrud, Pune – 411038, hereby state as under:

1. The contents of the said notice are false, frivolous and vexatious and are denied in totality save and except what is specifically admitted herein.

2. My client is the absolute and exclusive owner of the property bearing Survey No. 45, Plot No. 7, Kothrud, Pune – 411038, by virtue of a registered Sale Deed dated 12-Mar-2019, registered before the Sub-Registrar of Assurances, Pune, bearing Document No. [Reg. No.].

3. The 7/12 extract (Satbara Utara) issued by the concerned Talathi office duly reflects the name of my client as the owner and cultivator of the said land.

4. The claim of the noticee regarding ownership of the said property is based on false and fabricated documents and is not maintainable in law.

5. My client calls upon your client to withdraw the aforesaid notice unconditionally within 7 (seven) days failing which my client shall be constrained to initiate appropriate legal proceedings for declaration of title, permanent injunction and damages for defamation and harassment, at the risk, cost and consequences of your client.

6. Without prejudice to the above, my client reserves all his legal rights and remedies.

Dated this day of November 2024.

Advocate for Vijay Kulkarni`,
  clientSummary:
    'विजय कुलकर्णी यांना त्यांच्या जमिनीवर खोटा दावा केला गेला आहे. त्यांनी 2019 मध्ये नोंदणीकृत खरेदीखत केले आहे आणि 7/12 उतारा त्यांच्या नावे आहे. हे उत्तर खोट्या नोटिसाला नाकारते आणि 7 दिवसांत नोटीस मागे घेण्यास सांगते, नाहीतर न्यायालयात जाण्याचा इशारा देते.',
  suggestedSections: [
    { section: 'Section 5', act: 'Transfer of Property Act, 1882', explanation: 'Defines transfer of property between living persons.' },
    { section: 'Section 54', act: 'Transfer of Property Act, 1882', explanation: 'Defines sale and sale deed requirements for immovable property.' },
    { section: 'Section 6', act: 'Specific Relief Act, 1963', explanation: 'Allows courts to compel parties to perform specific acts under a contract.' },
  ],
}
