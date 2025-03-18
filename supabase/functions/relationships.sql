INSERT INTO flashcard_collections_junction (flashcard_id, collection_id)
SELECT f.id, c.id
FROM flashcards f
JOIN collections c ON
       (f.question = ''How is an agency relationship created?'' AND c.title = ''Creation & Termination of Agency'')
    OR (f.question = ''How is an agency relationship terminated?'' AND c.title = ''Creation & Termination of Agency'')
    OR (f.question = ''What is the difference between express and implied actual authority?'' AND c.title = ''Authority of Agents'')
    OR (f.question = ''When does an agent act with apparent authority?'' AND c.title = ''Authority of Agents'')
    OR (f.question = ''How does principal liability differ for independent contractors?'' AND c.title = ''Principal''''s Liability'')
    OR (f.question = ''How is a general partnership (GP) formed?'' AND c.title = ''Formation of Partnerships'')
    OR (f.question = ''What is required to form a limited partnership (LP)?'' AND c.title = ''Formation of Partnerships'')
    OR (f.question = ''What is the duty of loyalty owed by partners to the partnership?'' AND c.title = ''Fiduciary Duties'')
    OR (f.question = ''What is the difference between dissolution and "winding up" in a partnership?'' AND c.title = ''Dissolution & Winding Up'')
    OR (f.question = ''What are the main causes of dissolution in a partnership?'' AND c.title = ''Dissolution & Winding Up'')
    OR (f.question = ''How can the articles of incorporation be amended?'' AND c.title = ''Formation & Governance'')
    OR (f.question = ''When can a court pierce the corporate veil?'' AND c.title = ''Shareholder Rights & Liabilities'')
    OR (f.question = ''What is the business judgment rule (BJR)?'' AND c.title = ''Director & Officer Duties'')
    OR (f.question = ''What is federal question jurisdiction?'' AND c.title = ''Subject Matter Jurisdiction'') -- Corrected Collection
    OR (f.question = ''What is diversity jurisdiction in federal court?'' AND c.title = ''Subject Matter Jurisdiction'') -- Corrected Collection
    OR (f.question = ''What is supplemental jurisdiction?'' AND c.title = ''Subject Matter Jurisdiction'') -- Corrected Collection
    OR (f.question = ''What is a compulsory counterclaim, and how does it affect jurisdiction?'' AND c.title = ''Subject Matter Jurisdiction'') -- Corrected Collection
    OR (f.question = ''What is a permissive counterclaim, and what are its jurisdictional requirements?'' AND c.title = ''Subject Matter Jurisdiction'') -- Corrected Collection
    OR (f.question = ''What is removal in the context of federal court jurisdiction?'' AND c.title = ''Subject Matter Jurisdiction'') -- Corrected Collection
    OR (f.question = ''What are the traditional bases for personal jurisdiction?'' AND c.title = ''Personal Jurisdiction & Venue'') -- Corrected Collection
    OR (f.question = ''What are state long-arm statutes, and how do they establish personal jurisdiction?'' AND c.title = ''Personal Jurisdiction & Venue'') -- Corrected Collection
    OR (f.question = ''What is general jurisdiction, and when is it applicable?'' AND c.title = ''Personal Jurisdiction & Venue'') -- Corrected Collection
    OR (f.question = ''What is specific jurisdiction, and how is it determined?'' AND c.title = ''Personal Jurisdiction & Venue'') -- Corrected Collection
    OR (f.question = ''What is venue, and how is it determined in a civil action?'' AND c.title = ''Personal Jurisdiction & Venue'') -- Corrected Collection
    OR (f.question = ''How is an individual''s residence determined for venue purposes?'' AND c.title = ''Personal Jurisdiction & Venue'') -- Corrected Collection
    OR (f.question = ''How is the residence of a business entity determined for venue purposes?'' AND c.title = ''Personal Jurisdiction & Venue'') -- Corrected Collection
    OR (f.question = ''How is the residence of foreign defendants determined for venue purposes?'' AND c.title = ''Personal Jurisdiction & Venue'') -- Corrected Collection
    OR (f.question = ''What happens if venue is proper, but there is a request for a change of venue?'' AND c.title = ''Personal Jurisdiction & Venue'') -- Corrected Collection
    OR (f.question = ''What must a court do if the venue is improper?'' AND c.title = ''Personal Jurisdiction & Venue'') -- Corrected Collection
    OR (f.question = ''How does the choice of law apply in a change of venue from a proper venue?'' AND c.title = ''Personal Jurisdiction & Venue'') -- Corrected Collection
    OR (f.question = ''How does the choice of law apply in a change of venue from an improper venue?'' AND c.title = ''Personal Jurisdiction & Venue'') -- Corrected Collection
    OR (f.question = ''What is the Erie Doctrine, and how does it affect federal courts sitting in diversity jurisdiction?'' AND c.title = ''Erie Doctrine'') -- Corrected Collection
    OR (f.question = ''What are the elements of a claim for breach of contract?'' AND c.title = ''Contract Performance & Breach'')
    OR (f.question = ''What is the Statute of Frauds, and what types of contracts does it apply to?'' AND c.title = ''Defenses to Formation'') -- Corrected Collection
    OR (f.question = ''What is anticipatory repudiation, and what remedies are available?'' AND c.title = ''Performance & Breach'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of substantial performance, and when does it apply?'' AND c.title = ''Performance & Breach'') -- Corrected Collection
    OR (f.question = ''What are liquidated damages, and when are they enforceable?'' AND c.title = ''Remedies'') -- Corrected Collection
    OR (f.question = ''What is specific performance, and when is it an available remedy?'' AND c.title = ''Remedies'') -- Corrected Collection
    OR (f.question = ''What is a fiduciary duty, and who typically owes it?'' AND c.title = ''General Legal Concepts'')
    OR (f.question = ''What is the duty of loyalty, and how does it apply to fiduciaries?'' AND c.title = ''General Legal Concepts'')
    OR (f.question = ''What is the standard for liability under the business judgment rule?'' AND c.title = ''Director & Officer Duties'')
    OR (f.question = ''What is an easement, and what are the types of easements?'' AND c.title = ''Easements, Covenants, & Servitudes'') -- Corrected Collection
    OR (f.question = ''What is adverse possession, and what are its elements?'' AND c.title = ''Easements & Adverse Possession'') -- Minor Correction, more specific collection
    OR (f.question = ''What is a life estate, and what rights does a life tenant have?'' AND c.title = ''Present Estates & Future Interests'') -- Corrected Collection
    OR (f.question = ''What is a variance in the context of zoning law?'' AND c.title = ''Easements, Covenants, & Servitudes'') -- Corrected Collection - Zoning is land use regulation, related to servitudes
    OR (f.question = ''What is the Takings Clause, and how does it apply to property law?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the public use requirement under the Takings Clause?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the just compensation requirement under the Takings Clause?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is procedural due process, and what protections does it offer?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is substantive due process, and what are the two levels of scrutiny applied?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Equal Protection Clause, and how does it apply to governmental classifications?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Dormant Commerce Clause?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What are the First Amendment protections for freedom of speech and expression?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is the clear and present danger test for free speech?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is the Due Process Clause of the Fifth Amendment, and how does it apply to federal actions?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Takings Clause of the Fifth Amendment, and what does it protect?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the Equal Protection Clause of the Fourteenth Amendment, and how does it apply to state actions?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Due Process Clause of the Fourteenth Amendment, and how does it differ from the Fifth Amendment Due Process Clause?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Commerce Clause, and how does it empower Congress?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the Eleventh Amendment, and how does it limit federal jurisdiction?'' AND c.title = ''Subject Matter Jurisdiction'') -- Corrected Collection
    OR (f.question = ''What is the Dormant Commerce Clause, and how does it affect state regulation of commerce?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is judicial review, and which case established its principle?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Chevron doctrine, and how does it affect judicial review of administrative actions?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection - falls under Judicial Review
    OR (f.question = ''What is the state action doctrine, and how does it limit the application of constitutional protections?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the Public Function Doctrine, and how does it relate to the state action doctrine?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the Entanglement Exception to the state action doctrine?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the difference between procedural due process and substantive due process?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is express preemption, and how is it established?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation (Federal Preemption)
    OR (f.question = ''What is the Equal Protection Clause, and what types of discrimination does it address?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Rational Basis Test, and when is it applied in Equal Protection analysis?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Strict Scrutiny Test, and when is it applied in Equal Protection analysis?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Intermediate Scrutiny Test, and when is it applied in Equal Protection analysis?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What are the fundamental rights protected under substantive due process?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is substantive due process, and how does it differ from procedural due process?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the "clear and present danger" test for limiting free speech?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is the Takings Clause, and what does it require?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is procedural due process, and what does it require before deprivation of life, liberty, or property?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Due Process Clause of the Fourteenth Amendment, and how does it apply to state actions?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Commerce Clause, and how has it been used to expand federal regulatory power?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the Due Process Clause of the Fifth Amendment, and how does it differ from the Fourteenth Amendment''''s Due Process Clause?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Clear and Present Danger Test, and how is it applied to free speech cases?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is the public forum doctrine, and how does it affect free speech rights?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is the Equal Protection Clause, and how does it address discriminatory laws?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What are the three levels of scrutiny applied in Equal Protection cases?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Establishment Clause, and how does it limit government actions regarding religion?'' AND c.title = ''First Amendment: Religion (Establishment Clause & Free Exercise Clause)'') -- Corrected Collection
    OR (f.question = ''What is the Free Exercise Clause, and what protections does it offer to individuals?'' AND c.title = ''First Amendment: Religion (Establishment Clause & Free Exercise Clause)'') -- Corrected Collection
    OR (f.question = ''What is substantive due process, and how does it protect fundamental rights?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is judicial review, and which landmark case established this principle?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Commerce Clause, and how has it been interpreted to expand federal power?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the Dormant Commerce Clause, and how does it restrict state regulation?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the Equal Protection Clause, and what does it require of state governments?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the state action doctrine, and when does it apply to constitutional claims?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the doctrine of judicial review, and which Supreme Court case established it?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Takings Clause, and what does it require when the government takes private property?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the Due Process Clause, and how does it protect individuals'''' rights against government actions?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is substantive due process, and how does it protect against arbitrary government actions?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Establishment Clause of the First Amendment, and how does it affect government involvement with religion?'' AND c.title = ''First Amendment: Religion (Establishment Clause & Free Exercise Clause)'') -- Corrected Collection
    OR (f.question = ''What is the Free Exercise Clause of the First Amendment, and what protections does it offer?'' AND c.title = ''First Amendment: Religion (Establishment Clause & Free Exercise Clause)'') -- Corrected Collection
    OR (f.question = ''What is the Due Process Clause of the Fifth Amendment, and how does it protect individuals'''' rights?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Due Process Clause of the Fourteenth Amendment, and how does it extend protections to state actions?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Equal Protection Clause of the Fourteenth Amendment, and how does it prevent discriminatory laws?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Commerce Clause, and how has it been interpreted to expand federal regulatory power?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the difference between express preemption and implied preemption?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation (Federal Preemption)
    OR (f.question = ''What is the concept of judicial review, and how was it established in U.S. law?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the difference between substantive and procedural due process?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Fourteenth Amendment''''s Equal Protection Clause, and what levels of scrutiny are applied under it?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Equal Protection Clause, and how does it apply to state actions?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Takings Clause of the Fifth Amendment, and what does it require when private property is taken?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the Due Process Clause of the Fourteenth Amendment, and how does it protect against state infringements?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Equal Protection Clause of the Fourteenth Amendment, and what is its significance in civil rights cases?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Commerce Clause, and how has it been used to justify federal regulation?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the Clear and Present Danger Test, and how does it apply to restrictions on free speech?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of state action, and why is it significant in constitutional law?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is the Establishment Clause, and how does it restrict government involvement with religion?'' AND c.title = ''First Amendment: Religion (Establishment Clause & Free Exercise Clause)'') -- Corrected Collection
    OR (f.question = ''What is the Free Exercise Clause, and what protections does it offer to individuals?'' AND c.title = ''First Amendment: Religion (Establishment Clause & Free Exercise Clause)'') -- Corrected Collection
    OR (f.question = ''What is procedural due process, and what does it require before deprivation of life, liberty, or property?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is substantive due process, and how does it protect fundamental rights?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the difference between a public forum and a non-public forum regarding free speech rights?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is the Double Jeopardy Clause, and what protections does it offer?'' AND c.title = ''Fifth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the political question doctrine, and when does it prevent judicial review?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the principle of equal protection, and how does it apply to different forms of discrimination?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What are the ways in which the authority of an agent can bind a principal to a contract?'' AND c.title = ''Agency'') -- Corrected Collection
    OR (f.question = ''What is the inherent agency power?'' AND c.title = ''Agency'') -- Corrected Collection
    OR (f.question = ''Under what circumstances may a principal be liable for the torts committed by an agent under respondeat superior?'' AND c.title = ''Negligence: Causation (Actual & Proximate Cause)'') -- Incorrect Collection, corrected to Torts->Negligence
    OR (f.question = ''What fiduciary duties does an agent owe to the principal?'' AND c.title = ''Agency'') -- Corrected Collection
    OR (f.question = ''How does a limited liability partnership (LLP) protect its partners?'' AND c.title = ''Partnerships'') -- Corrected Collection
    OR (f.question = ''When is a partnership liable for the wrongful acts of a partner?'' AND c.title = ''Partnerships'') -- Corrected Collection
    OR (f.question = ''What is the contract liability of the partners in a partnership?'' AND c.title = ''Partnerships'') -- Corrected Collection
    OR (f.question = ''What are the rights of partners regarding the management and control of the partnership?'' AND c.title = ''Partnerships'') -- Corrected Collection
    OR (f.question = ''How can a partner''''s interest in a partnership be transferred?'' AND c.title = ''Partnerships'') -- Corrected Collection
    OR (f.question = ''What is the duty of care owed by partners to the partnership?'' AND c.title = ''Partnerships'') -- Corrected Collection
    OR (f.question = ''What happens upon the disassociation of a partner under the Uniform Partnership Act (UPA)?'' AND c.title = ''Partnerships'') -- Corrected Collection
    OR (f.question = ''What happens upon the disassociation of a partner under the Revised Uniform Partnership Act (RUPA)?'' AND c.title = ''Partnerships'') -- Corrected Collection
    OR (f.question = ''How can a term partnership be dissolved under RUPA before its term expires?'' AND c.title = ''Partnerships'') -- Corrected Collection
    OR (f.question = ''How is a corporation generally formed?'' AND c.title = ''Corporations: Formation & Structure'') -- Corrected Collection
    OR (f.question = ''What are corporate bylaws and how can they be amended?'' AND c.title = ''Corporations: Formation & Structure'') -- Corrected Collection
    OR (f.question = ''What is the liability of a promoter for contracts entered into on behalf of a yet-to-be-formed corporation?'' AND c.title = ''Corporations: Formation & Structure'') -- Corrected Collection
    OR (f.question = ''When is a corporation bound by pre-incorporation contracts entered into by promoters?'' AND c.title = ''Corporations: Formation & Structure'') -- Corrected Collection
    OR (f.question = ''What rights do holders of common stock have in a corporation?'' AND c.title = ''Corporations: Shareholder Rights & Actions'') -- Corrected Collection
    OR (f.question = ''What are the characteristics of preferred stock in a corporation?'' AND c.title = ''Corporations: Shareholder Rights & Actions'') -- Corrected Collection
    OR (f.question = ''What are authorized shares in a corporation?'' AND c.title = ''Corporations: Formation & Structure'') -- Corrected Collection
    OR (f.question = ''What are outstanding shares and how do they differ from treasury stock?'' AND c.title = ''Corporations: Formation & Structure'') -- Corrected Collection
    OR (f.question = ''What are stock options and how can they be issued?'' AND c.title = ''Corporations: Formation & Structure'') -- Corrected Collection
    OR (f.question = ''What are preemptive rights in a corporation?'' AND c.title = ''Corporations: Shareholder Rights & Actions'') -- Corrected Collection
    OR (f.question = ''What determines a shareholder''''s right to receive dividends or distributions from a corporation?'' AND c.title = ''Corporations: Shareholder Rights & Actions'') -- Corrected Collection
    OR (f.question = ''How can shareholders participate in the governance of a corporation?'' AND c.title = ''Corporations: Shareholder Rights & Actions'') -- Corrected Collection
    OR (f.question = ''What is the role of the board of directors in managing a corporation?'' AND c.title = ''Corporations: Directors & Officers (Duties, Liability)'') -- Corrected Collection
    OR (f.question = ''What duties do directors and officers owe to the corporation?'' AND c.title = ''Corporations: Directors & Officers (Duties, Liability)'') -- Corrected Collection
    OR (f.question = ''What are conflicting interest transactions, and how can a director or officer be protected from liability in such cases?'' AND c.title = ''Corporations: Directors & Officers (Duties, Liability)'') -- Corrected Collection
    OR (f.question = ''What is the corporate opportunity doctrine?'' AND c.title = ''Corporations: Directors & Officers (Duties, Liability)'') -- Corrected Collection
    OR (f.question = ''What is required for a merger or consolidation of corporations?'' AND c.title = ''Mergers & Dissolutions'') -- Using existing collection, seems appropriate
    OR (f.question = ''What are short-form mergers?'' AND c.title = ''Mergers & Dissolutions'') -- Using existing collection, seems appropriate
    OR (f.question = ''What rights do dissenting shareholders have after a merger or consolidation?'' AND c.title = ''Corporations: Shareholder Rights & Actions'') -- Corrected Collection
    OR (f.question = ''When is shareholder approval required for the sale of corporate assets?'' AND c.title = ''Corporations: Shareholder Rights & Actions'') -- Corrected Collection
    OR (f.question = ''What are derivative claims in the context of corporate litigation?'' AND c.title = ''Corporations: Shareholder Rights & Actions'') -- Corrected Collection
    OR (f.question = ''What is the demand requirement for derivative claims?'' AND c.title = ''Corporations: Shareholder Rights & Actions'') -- Corrected Collection
    OR (f.question = ''What is a direct claim by a shareholder?'' AND c.title = ''Corporations: Shareholder Rights & Actions'') -- Corrected Collection
    OR (f.question = ''What is the well-pleaded complaint rule?'' AND c.title = ''Subject Matter Jurisdiction'') -- Corrected Collection
    OR (f.question = ''How is an individual''''s citizenship determined for diversity purposes?'' AND c.title = ''Diversity Jurisdiction'') -- More specific collection within Subject Matter Jurisdiction
    OR (f.question = ''How is a corporation''''s citizenship determined for diversity purposes?'' AND c.title = ''Diversity Jurisdiction'') -- More specific collection within Subject Matter Jurisdiction
    OR (f.question = ''What is required for service of process in a civil action?'' AND c.title = ''Pleadings & Motions'') --  More specific collection within Civil Procedure, though might also fit Pre-Trial/Trial
    OR (f.question = ''How can an individual within the United States be served with process?'' AND c.title = ''Pleadings & Motions'') -- More specific collection within Civil Procedure
    OR (f.question = ''How can an individual in a foreign country be served with process?'' AND c.title = ''Pleadings & Motions'') -- More specific collection within Civil Procedure
    OR (f.question = ''How can a corporation, partnership, or association be served with process?'' AND c.title = ''Pleadings & Motions'') -- More specific collection within Civil Procedure
    OR (f.question = ''What is the difference between substance and procedure in choice of law?'' AND c.title = ''Choice of Law / Conflict of Laws'') -- Corrected Collection
    OR (f.question = ''What is the Full Faith and Credit Clause?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection - State Relations aspect of Federalism
    OR (f.question = ''What is state sovereign immunity under the 11th Amendment?'' AND c.title = ''Subject Matter Jurisdiction'') -- Corrected Collection
    OR (f.question = ''What are the exceptions to the 11th Amendment''''s application?'' AND c.title = ''Subject Matter Jurisdiction'') -- Corrected Collection
    OR (f.question = ''What is the standing requirement for a federal court to decide a case?'' AND c.title = ''Pre-Trial & Trial'') -- Could fit motions, but more generally Pre-Trial phase
    OR (f.question = ''What is mootness, and how does it affect a case?'' AND c.title = ''Appeals & Preclusion'') -- Corrected Collection - timing issue related to appeals/finality
    OR (f.question = ''What is ripeness, and how does it affect a case?'' AND c.title = ''Pre-Trial & Trial'') --  Pre-Trial phase issue
    OR (f.question = ''What is the political question doctrine?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What are the abstention doctrines, and when do they apply?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection - Court Procedures/Federal-State Court relationship
    OR (f.question = ''What is the requirement for a class action lawsuit to be certified in federal court?'' AND c.title = ''Pleadings & Motions'') -- Corrected Collection
    OR (f.question = ''What are the types of class actions under Federal Rule of Civil Procedure 23?'' AND c.title = ''Pleadings & Motions'') -- Corrected Collection
    OR (f.question = ''What is the role of the court in settlement, dismissal, or compromise of a class action?'' AND c.title = ''Pleadings & Motions'') -- Corrected Collection
    OR (f.question = ''What is a preliminary injunction, and when can it be issued?'' AND c.title = ''Pre-Trial & Trial'') -- Pre-Trial Remedy
    OR (f.question = ''What is a temporary restraining order (TRO), and how does it differ from a preliminary injunction?'' AND c.title = ''Pre-Trial & Trial'') -- Pre-Trial Remedy
    OR (f.question = ''What is a unilateral contract, and how is it accepted?'' AND c.title = ''Formation'') -- Corrected Collection
    OR (f.question = ''What is a bilateral contract, and how is it accepted?'' AND c.title = ''Formation'') -- Corrected Collection
    OR (f.question = ''What are the defenses to the enforcement of a contract?'' AND c.title = ''Defenses to Formation'') -- Corrected Collection
    OR (f.question = ''What is the Parol Evidence Rule, and how does it affect contract interpretation?'' AND c.title = ''Contract Terms & Interpretation'') -- Corrected Collection
    OR (f.question = ''What is promissory estoppel, and when does it apply?'' AND c.title = ''Formation'') -- Corrected Collection - consideration substitute related to formation
    OR (f.question = ''What is unjust enrichment, and what are the elements required to prove it?'' AND c.title = ''Remedies'') -- Corrected Collection - Restitution Remedy
    OR (f.question = ''What is a constructive trust, and when is it imposed?'' AND c.title = ''Remedies'') -- Corrected Collection - Equitable Remedy
    OR (f.question = ''What is a resulting trust, and when does it arise?'' AND c.title = ''Trusts: Creation & Types (Express, Resulting, Constructive)'') -- Corrected Collection - Trusts Subject
    OR (f.question = ''What is the duty of care in a fiduciary relationship?'' AND c.title = ''Agency'') -- Fiduciary Duty in Agency
    OR (f.question = ''What is the rule against perpetuities, and what is its purpose?'' AND c.title = ''Future Interests & Powers of Appointment'') -- Corrected Collection - Wills/Trusts/Estates Subject
    OR (f.question = ''What is the difference between a joint tenancy and a tenancy in common?'' AND c.title = ''Concurrent Ownership'') -- Corrected Collection
    OR (f.question = ''What is a tenancy by the entirety, and who can create it?'' AND c.title = ''Concurrent Ownership'') -- Corrected Collection
    OR (f.question = ''What are future interests in property law?'' AND c.title = ''Present Estates & Future Interests'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of waste, and how does it apply to property?'' AND c.title = ''Present Estates & Future Interests'') -- Corrected Collection - Life Estate concept
    OR (f.question = ''What is a covenant running with the land, and how is it created?'' AND c.title = ''Easements, Covenants, & Servitudes'') -- Corrected Collection
    OR (f.question = ''What is an equitable servitude, and how does it differ from a covenant running with the land?'' AND c.title = ''Easements, Covenants, & Servitudes'') -- Corrected Collection
    OR (f.question = ''What is zoning, and what are the types of zoning ordinances?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation of Land Use
    OR (f.question = ''What is the Privileges and Immunities Clause of Article IV?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection - State Relations under Federalism
    OR (f.question = ''What are content-based and content-neutral regulations under the First Amendment?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What are the exceptions to protected speech under the First Amendment?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is the Establishment Clause of the First Amendment?'' AND c.title = ''First Amendment: Religion (Establishment Clause & Free Exercise Clause)'') -- Corrected Collection
    OR (f.question = ''What is the Free Exercise Clause of the First Amendment?'' AND c.title = ''First Amendment: Religion (Establishment Clause & Free Exercise Clause)'') -- Corrected Collection
    OR (f.question = ''What is the Lemon test, and how is it applied under the Establishment Clause?'' AND c.title = ''First Amendment: Religion (Establishment Clause & Free Exercise Clause)'') -- Corrected Collection
    OR (f.question = ''What are the requirements for standing to sue under the First Amendment?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Standing in Free Speech context
    OR (f.question = ''What is the Second Amendment right to bear arms?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Broadly related to individual rights
    OR (f.question = ''What are the Fourth Amendment protections against unreasonable searches and seizures?'' AND c.title = ''Fourth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the exclusionary rule, and how does it apply to Fourth Amendment violations?'' AND c.title = ''Exclusionary Rule & Fruit of the Poisonous Tree'') -- Corrected Collection
    OR (f.question = ''What is the Fifth Amendment right against self-incrimination?'' AND c.title = ''Fifth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Fifth Amendment protection against double jeopardy?'' AND c.title = ''Fifth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Sixth Amendment right to a speedy trial?'' AND c.title = ''Sixth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Sixth Amendment right to a public trial?'' AND c.title = ''Sixth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Sixth Amendment right to an impartial jury?'' AND c.title = ''Sixth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Confrontation Clause of the Sixth Amendment?'' AND c.title = ''Sixth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Compulsory Process Clause of the Sixth Amendment?'' AND c.title = ''Sixth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Sixth Amendment right to counsel?'' AND c.title = ''Sixth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Eighth Amendment prohibition on excessive bail?'' AND c.title = ''Eighth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Eighth Amendment protection against cruel and unusual punishment?'' AND c.title = ''Eighth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Eighth Amendment protection against excessive fines?'' AND c.title = ''Eighth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Thirteenth Amendment, and what does it prohibit?'' AND c.title = ''Individual Rights: Equal Protection'') -- Broadly related to individual rights/equality
    OR (f.question = ''What is the Privileges or Immunities Clause of the Fourteenth Amendment?'' AND c.title = ''Individual Rights: Equal Protection'') -- Broadly related to individual rights/equality
    OR (f.question = ''What is the Nineteenth Amendment, and what does it provide?'' AND c.title = ''Individual Rights: Equal Protection'') -- Voting Rights/Equality
    OR (f.question = ''What is the Twenty-Sixth Amendment, and what does it provide?'' AND c.title = ''Individual Rights: Equal Protection'') -- Voting Rights/Equality
    OR (f.question = ''What is the Supremacy Clause, and how does it affect the relationship between federal and state law?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Necessary and Proper Clause, and how does it expand Congressional power?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the Taxing and Spending Clause, and how does it empower Congress?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the Treaty Clause, and what does it authorize?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch power
    OR (f.question = ''What is the Appointments Clause, and how does it regulate the appointment of federal officers?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch power
    OR (f.question = ''What is the Impeachment Clause, and how does it govern the removal of federal officers?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch power (and check on it)
    OR (f.question = ''What is the Full Faith and Credit Clause, and how does it affect state relations?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Contracts Clause, and how does it limit state power?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - State power limitations
    OR (f.question = ''What is the Ex Post Facto Clause, and what does it prohibit?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Individual Rights protection in Criminal context
    OR (f.question = ''What is the Bill of Attainder Clause, and what does it prohibit?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Individual Rights protection
    OR (f.question = ''What is the Privileges and Immunities Clause of the Fourteenth Amendment, and how does it differ from Article IV''s Privileges and Immunities Clause?'' AND c.title = ''Individual Rights: Equal Protection'') -- Related to equality/rights
    OR (f.question = ''What are the powers of Congress under the War Powers Clause?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the Fifteenth Amendment, and what does it provide?'' AND c.title = ''Individual Rights: Equal Protection'') -- Voting Rights/Equality
    OR (f.question = ''What is the Necessary and Proper Clause, and how does it relate to Congressional authority?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the Spending Power, and how does it allow Congress to influence state policy?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the scope of Congress''''s investigative power?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the Tenth Amendment, and how does it limit federal power?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Commander-in-Chief Clause, and what authority does it grant the President?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch power
    OR (f.question = ''What is the Speech or Debate Clause, and how does it protect members of Congress?'' AND c.title = ''Congressional Powers'') -- Corrected Collection - Congressional operation/independence
    OR (f.question = ''What is the Emoluments Clause, and how does it restrict federal officials?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch limitations
    OR (f.question = ''What is the Oath or Affirmation Clause, and what does it require?'' AND c.title = ''General Legal Concepts'') -- Basic government structure concept
    OR (f.question = ''What is the Non-Delegation Doctrine, and how does it limit Congressional power?'' AND c.title = ''Congressional Powers'') -- Corrected Collection - Congressional power limitation
    OR (f.question = ''What is the Guarantee Clause, and what does it guarantee to every state?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Take Care Clause, and what duty does it impose on the President?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch duty
    OR (f.question = ''What is the Enforcement Clause of the Fourteenth Amendment, and how does it empower Congress?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the political question doctrine, and when is it applied?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the rational basis review, and when is it applied?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is intermediate scrutiny, and when is it applied?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is strict scrutiny, and when is it applied?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is sovereign immunity, and how does it apply to the federal government and states?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection - Federal-State Relationship
    OR (f.question = ''What is the Eleventh Amendment, and what does it protect?'' AND c.title = ''Subject Matter Jurisdiction'') -- Corrected Collection
    OR (f.question = ''What is the Incorporation Doctrine, and how does it apply to the Bill of Rights?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection - Due Process mechanism
    OR (f.question = ''What is the doctrine of abstention, and when might a federal court apply it?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of stare decisis, and how does it guide judicial decision-making?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection - Judicial Branch function
    OR (f.question = ''What is the doctrine of preemption, and how does it affect state and local laws?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation/Federal-State conflict
    OR (f.question = ''What is field preemption, and when does it occur?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation/Federal-State conflict
    OR (f.question = ''What is conflict preemption, and when does it occur?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation/Federal-State conflict
    OR (f.question = ''What is the Lemon Test, and how is it used to evaluate Establishment Clause violations?'' AND c.title = ''First Amendment: Religion (Establishment Clause & Free Exercise Clause)'') -- Corrected Collection
    OR (f.question = ''What is the "time, place, and manner" restriction on speech?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What are "fighting words," and are they protected under the First Amendment?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is commercial speech, and what level of protection does it receive under the First Amendment?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is symbolic speech, and how is it protected under the First Amendment?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is the Free Exercise Clause, and how does it protect religious freedom?'' AND c.title = ''First Amendment: Religion (Establishment Clause & Free Exercise Clause)'') -- Corrected Collection
    OR (f.question = ''What is the Establishment Clause, and what does it prohibit?'' AND c.title = ''First Amendment: Religion (Establishment Clause & Free Exercise Clause)'') -- Corrected Collection
    OR (f.question = ''What is the Privileges or Immunities Clause of the Fourteenth Amendment?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Privileges and Immunities Clause of Article IV, and how does it differ from the Fourteenth Amendment''''s Privileges or Immunities Clause?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Incorporation Doctrine, and how does it apply to the Bill of Rights?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Voting Rights Act of 1965, and what does it prohibit?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection - Voting Rights/Equality
    OR (f.question = ''What is the Twenty-Fourth Amendment, and what does it prohibit?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection - Voting Rights/Equality
    OR (f.question = ''What is the process for amending the U.S. Constitution under Article V?'' AND c.title = ''General Legal Concepts'') -- Basic Constitutional Structure
    OR (f.question = ''What is the Supremacy Clause, and how does it resolve conflicts between federal and state laws?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What are the inherent powers of the President, and how are they derived?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch power
    OR (f.question = ''What is the doctrine of executive privilege, and how does it protect presidential communications?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch power
    OR (f.question = ''What is the role of the Vice President under the U.S. Constitution?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch structure
    OR (f.question = ''What is the doctrine of judicial restraint, and how does it guide judicial decision-making?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection - Judicial Branch philosophy
    OR (f.question = ''What is the principle of federalism, and how is it embodied in the U.S. Constitution?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the impeachment process for federal officials, and what are the grounds for impeachment?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch accountability
    OR (f.question = ''What is the separation of powers, and how does it function in the U.S. government?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Necessary and Proper Clause, and why is it sometimes called the "Elastic Clause"?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What are enumerated powers, and where are they found in the Constitution?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What are implied powers, and how are they justified under the Constitution?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the Tenth Amendment, and what powers does it reserve?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the War Powers Resolution, and how does it limit the President''''s authority?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch power limitations
    OR (f.question = ''What is the Emoluments Clause, and what restrictions does it impose on federal officials?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch limitations
    OR (f.question = ''What is the Full Faith and Credit Clause, and how does it ensure cooperation among states?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of incorporation, and how does it apply to the Bill of Rights?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Spending Clause, and how does it empower Congress to influence state policies?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of selective incorporation, and how does it apply to the states?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Miller Test, and how does it define obscenity under the First Amendment?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is the Exclusionary Rule, and what is its purpose in criminal procedure?'' AND c.title = ''Exclusionary Rule & Fruit of the Poisonous Tree'') -- Corrected Collection
    OR (f.question = ''What are Miranda Rights, and when must they be given?'' AND c.title = ''Fifth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Fruit of the Poisonous Tree Doctrine, and how does it apply to evidence obtained after an illegal search or seizure?'' AND c.title = ''Exclusionary Rule & Fruit of the Poisonous Tree'') -- Corrected Collection
    OR (f.question = ''What is double jeopardy, and what does the Fifth Amendment protect against?'' AND c.title = ''Fifth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Sixth Amendment right to a jury trial, and what cases does it apply to?'' AND c.title = ''Sixth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Sixth Amendment right to counsel, and when does it attach?'' AND c.title = ''Sixth Amendment'') -- Corrected Collection
    OR (f.question = ''What is cruel and unusual punishment, and how does the Eighth Amendment protect against it?'' AND c.title = ''Eighth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Incorporation Doctrine, and how has it been applied to the states?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Privileges and Immunities Clause of Article IV, and how does it protect non-residents?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the principle of stare decisis, and why is it important in the judicial system?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Necessary and Proper Clause, and how does it enable Congressional action?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the concept of federalism, and how does it structure the relationship between national and state governments?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the rule against perpetuities, and what is its purpose in property law?'' AND c.title = ''Wills: Validity & Execution'') -- More appropriate collection under Wills/Trusts/Estates
    OR (f.question = ''What is the Supremacy Clause, and how does it affect the validity of state laws?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Speech or Debate Clause, and how does it protect members of Congress?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the Commander-in-Chief Clause, and what powers does it grant the President?'' AND c.title = ''Executive Powers'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of separation of powers, and how does it function in the U.S. government?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Public Function Doctrine, and how does it apply to private entities?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - Government Regulation
    OR (f.question = ''What is sovereign immunity, and how does it protect states and the federal government?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Impeachment Clause, and what process does it outline for removing federal officials?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch Accountability
    OR (f.question = ''What is the Full Faith and Credit Clause, and how does it ensure legal continuity among states?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Ex Post Facto Clause, and what types of laws does it prohibit?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Bill of Attainder Clause, and what does it prevent?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Eleventh Amendment, and how does it reinforce the principle of state sovereign immunity?'' AND c.title = ''Subject Matter Jurisdiction'') -- Corrected Collection
    OR (f.question = ''What is the Twenty-Fifth Amendment, and what procedures does it establish for presidential succession and disability?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch structure
    OR (f.question = ''What is the Contracts Clause, and how does it limit state authority?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - State Power Limitations
    OR (f.question = ''What is the Privileges or Immunities Clause of the Fourteenth Amendment, and what rights does it protect?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the principle of checks and balances, and how does it function in the U.S. government?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Eighth Amendment''''s prohibition on excessive fines, and how is it applied?'' AND c.title = ''Eighth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Fourteenth Amendment, and what are its three key provisions?'' AND c.title = ''General Legal Concepts'') -- Basic Constitutional Structure
    OR (f.question = ''What is the concept of judicial activism, and how does it contrast with judicial restraint?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection - Judicial Branch Philosophy
    OR (f.question = ''What is a Bill of Attainder, and why is it prohibited by the Constitution?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of standing, and what must a plaintiff demonstrate to have standing in federal court?'' AND c.title = ''Pre-Trial & Trial'') -- Pre-Trial Procedure
    OR (f.question = ''What is the Non-Delegation Doctrine, and how does it limit Congress''''s ability to delegate its powers?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the Lemon Test, and how does it evaluate potential Establishment Clause violations?'' AND c.title = ''First Amendment: Religion (Establishment Clause & Free Exercise Clause)'') -- Corrected Collection
    OR (f.question = ''What is the Fifth Amendment''''s protection against self-incrimination, and when does it apply?'' AND c.title = ''Fifth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the role of the judiciary in interpreting the Constitution, and how is this role established?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of incorporation, and how has it expanded the protection of individual rights?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Appointments Clause, and how does it regulate the appointment of federal officers?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch power
    OR (f.question = ''What is the Eleventh Amendment, and how does it protect states from lawsuits?'' AND c.title = ''Subject Matter Jurisdiction'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of executive privilege, and what are its limitations?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch power
    OR (f.question = ''What is the Fifteenth Amendment, and what does it guarantee?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection - Voting Rights/Equality
    OR (f.question = ''What is the Nineteenth Amendment, and what impact did it have on voting rights?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection - Voting Rights/Equality
    OR (f.question = ''What is the Twenty-Sixth Amendment, and how does it affect voting age requirements?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection - Voting Rights/Equality
    OR (f.question = ''What is the Voting Rights Act of 1965, and what protections does it provide?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection - Voting Rights/Equality
    OR (f.question = ''What is the process for a constitutional amendment under Article V of the Constitution?'' AND c.title = ''General Legal Concepts'') -- Basic Constitutional Structure
    OR (f.question = ''What is the Speech or Debate Clause, and what immunity does it provide to members of Congress?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of sovereign immunity, and how does it protect states and the federal government?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Full Faith and Credit Clause, and how does it promote legal uniformity among states?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Contracts Clause, and what limitations does it impose on state authority?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection - State Power Limitations
    OR (f.question = ''What is the Exclusionary Rule, and what is its purpose in criminal law?'' AND c.title = ''Exclusionary Rule & Fruit of the Poisonous Tree'') -- Corrected Collection
    OR (f.question = ''What are Miranda Rights, and when must law enforcement officers provide them?'' AND c.title = ''Fifth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Fifth Amendment protection against double jeopardy, and what does it prevent?'' AND c.title = ''Fifth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Sixth Amendment right to a speedy trial, and why is it important?'' AND c.title = ''Sixth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Sixth Amendment right to a public trial, and when can it be limited?'' AND c.title = ''Sixth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Eighth Amendment protection against cruel and unusual punishment, and what does it prohibit?'' AND c.title = ''Eighth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the principle of incorporation, and how has it been applied to the Bill of Rights?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the Privileges or Immunities Clause of the Fourteenth Amendment, and what rights does it protect?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Voting Rights Act of 1965, and what impact did it have on voting rights in the United States?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Tenth Amendment, and what powers does it reserve to the states and the people?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Twenty-Fourth Amendment, and what does it prohibit?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Twenty-Second Amendment, and what limits does it place on presidential terms?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch structure
    OR (f.question = ''What is the doctrine of strict scrutiny, and when is it applied in constitutional cases?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is intermediate scrutiny, and when is it applied in constitutional law?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the rational basis review, and when is it used in constitutional analysis?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Privileges and Immunities Clause of Article IV, and how does it protect non-residents?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Necessary and Proper Clause, and why is it considered an "elastic clause"?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the Guarantee Clause, and what does it ensure for each state?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of preemption, and how does it affect the relationship between federal and state laws?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection
    OR (f.question = ''What is the Emoluments Clause, and how does it restrict federal officials?'' AND c.title = ''Executive Powers'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of incorporation, and how does it expand the protection of individual rights?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the public function doctrine, and how does it apply to private entities?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of sovereign immunity, and how does it protect states?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Supremacy Clause, and how does it resolve conflicts between federal and state laws?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of stare decisis, and why is it important in the judicial system?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Eleventh Amendment, and how does it impact the ability to sue states?'' AND c.title = ''Subject Matter Jurisdiction'') -- Corrected Collection
    OR (f.question = ''What is the Ex Post Facto Clause, and what types of laws does it prohibit?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the principle of federalism, and how is it reflected in the U.S. Constitution?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Contracts Clause, and how does it limit state authority over contracts?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of separation of powers, and how does it function in the U.S. government?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Sixth Amendment right to counsel, and why is it critical in criminal cases?'' AND c.title = ''Sixth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Eighth Amendment''''s protection against excessive bail, and how is it applied?'' AND c.title = ''Eighth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Twentieth Amendment, and what changes did it make to the presidential and congressional terms?'' AND c.title = ''Executive Powers'') -- Corrected Collection - Executive Branch structure
    OR (f.question = ''What is the Nineteenth Amendment, and what impact did it have on voting rights?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the concept of incorporation, and how has it affected state compliance with the Bill of Rights?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of stare decisis, and how does it influence judicial decisions?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of preemption, and how does it affect state and local laws?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection
    OR (f.question = ''What is the Privileges or Immunities Clause of the Fourteenth Amendment, and what rights does it protect?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Public Function Doctrine, and how does it apply to private actors?'' AND c.title = ''State Action & Government Regulation'') -- Corrected Collection
    OR (f.question = ''What is the Tenth Amendment, and how does it affirm the principle of federalism?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Necessary and Proper Clause, and why is it considered a source of implied powers?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the Voting Rights Act of 1965, and what measures did it implement to protect voting rights?'' AND c.title = ''Individual Rights: Equal Protection'') -- Corrected Collection
    OR (f.question = ''What is the Miller Test for obscenity, and what are its criteria?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is the Lemon Test, and how does it evaluate potential Establishment Clause violations?'' AND c.title = ''First Amendment: Religion (Establishment Clause & Free Exercise Clause)'') -- Corrected Collection
    OR (f.question = ''What is the concept of "fighting words," and are they protected under the First Amendment?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of content neutrality, and how does it affect government regulation of speech?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is symbolic speech, and how is it protected under the First Amendment?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is commercial speech, and what level of protection does it receive under the First Amendment?'' AND c.title = ''First Amendment: Speech, Press, and Association'') -- Corrected Collection
    OR (f.question = ''What is the exclusionary rule, and what is its purpose in criminal law?'' AND c.title = ''Exclusionary Rule & Fruit of the Poisonous Tree'') -- Corrected Collection
    OR (f.question = ''What are Miranda Rights, and when must they be provided to suspects?'' AND c.title = ''Fifth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Sixth Amendment right to a public trial, and what are its limitations?'' AND c.title = ''Sixth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Eighth Amendment''''s prohibition on cruel and unusual punishment, and how is it interpreted?'' AND c.title = ''Eighth Amendment'') -- Corrected Collection
    OR (f.question = ''What is the Establishment Clause of the First Amendment, and what does it prohibit regarding government actions?'' AND c.title = ''First Amendment: Religion (Establishment Clause & Free Exercise Clause)'') -- Corrected Collection
    OR (f.question = ''What is the incorporation doctrine, and how has it affected state application of the Bill of Rights?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is a Bill of Attainder, and why is it prohibited by the Constitution?'' AND c.title = ''Individual Rights: Due Process (Substantive & Procedural)'') -- Corrected Collection
    OR (f.question = ''What is the doctrine of mootness, and how does it affect court proceedings?'' AND c.title = ''Appeals & Preclusion'') -- Corrected Collection
    OR (f.question = ''What is the concept of executive privilege, and what are its limits?'' AND c.title = ''Executive Powers'') -- Corrected Collection
    OR (f.question = ''What is the scope of Congress''''s investigative power, and how is it justified under the Constitution?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the difference between direct and indirect taxes, and how are they regulated under the Constitution?'' AND c.title = ''Congressional Powers'') -- Corrected Collection
    OR (f.question = ''What is the impeachment process for a sitting President, and what standards apply?'' AND c.title = ''Executive Powers'') -- Corrected Collection
    OR (f.question = ''What is the Privileges and Immunities Clause of Article IV, and how does it promote national unity?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the Seventeenth Amendment, and how did it change the election of U.S. Senators?'' AND c.title = ''General Legal Concepts'') -- Basic Constitutional Structure
    OR (f.question = ''What is the Twenty-Fifth Amendment, and what procedures does it establish for presidential succession and disability?'' AND c.title = ''Executive Powers'') -- Corrected Collection
    OR (f.question = ''What is the War Powers Resolution, and how does it limit the President''''s military authority?'' AND c.title = ''Executive Powers'') -- Corrected Collection
    OR (f.question = ''What is the difference between judicial activism and judicial restraint?'' AND c.title = ''Federalism & Separation of Powers'') -- Corrected Collection
    OR (f.question = ''What is the role of the Vice President under the U.S. Constitution, and how does it relate to succession?'' AND c.title = ''Executive Powers'')
ON CONFLICT (flashcard_id, collection_id) DO NOTHING;