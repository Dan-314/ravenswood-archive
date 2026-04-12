-- Add homebrew detection flag to scripts
ALTER TABLE scripts ADD COLUMN has_homebrew boolean NOT NULL DEFAULT false;
ALTER TABLE script_versions ADD COLUMN has_homebrew boolean NOT NULL DEFAULT false;

CREATE INDEX scripts_homebrew ON scripts (has_homebrew);

-- Inline official character IDs so backfill is correct regardless of characters table state
CREATE TEMPORARY TABLE _official_ids (id text PRIMARY KEY);
INSERT INTO _official_ids (id) VALUES
  ('steward'),('knight'),('chef'),('noble'),('investigator'),('washerwoman'),('clockmaker'),('grandmother'),('librarian'),('shugenja'),('pixie'),('bountyhunter'),('empath'),('highpriestess'),('sailor'),('balloonist'),('general'),('preacher'),('chambermaid'),('villageidiot'),('snakecharmer'),('mathematician'),('king'),('dreamer'),('fortuneteller'),('cultleader'),('flowergirl'),('towncrier'),('oracle'),('undertaker'),('innkeeper'),('monk'),('gambler'),('acrobat'),('exorcist'),('lycanthrope'),('gossip'),('savant'),('alsaahir'),('engineer'),('nightwatchman'),('courtier'),('seamstress'),('philosopher'),('huntsman'),('professor'),('artist'),('slayer'),('fisherman'),('princess'),('juggler'),('soldier'),('alchemist'),('cannibal'),('amnesiac'),('farmer'),('minstrel'),('ravenkeeper'),('sage'),('choirboy'),('banshee'),('tealady'),('mayor'),('fool'),('virgin'),('magician'),('poppygrower'),('pacifist'),('atheist'),('hermit'),('butler'),('goon'),('ogre'),('lunatic'),('drunk'),('tinker'),('recluse'),('golem'),('sweetheart'),('plaguedoctor'),('klutz'),('moonchild'),('saint'),('barber'),('hatter'),('mutant'),('politician'),('zealot'),('damsel'),('snitch'),('heretic'),('puzzlemaster'),('mezepheles'),('godfather'),('poisoner'),('devilsadvocate'),('spy'),('harpy'),('witch'),('cerenovus'),('fearmonger'),('pithag'),('psychopath'),('assassin'),('wizard'),('widow'),('xaan'),('marionette'),('wraith'),('summoner'),('eviltwin'),('goblin'),('boomdandy'),('mastermind'),('scarletwoman'),('vizier'),('organgrinder'),('boffin'),('baron'),('yaggababble'),('pukka'),('lilmonsta'),('nodashii'),('imp'),('shabaloth'),('ojo'),('kazali'),('po'),('zombuul'),('vigormortis'),('vortox'),('legion'),('fanggu'),('lordoftyphon'),('lleech'),('alhadikhia'),('riot'),('leviathan'),('thief'),('bureaucrat'),('barista'),('harlot'),('butcher'),('cacklejack'),('gunslinger'),('matron'),('gangster'),('bonecollector'),('judge'),('apprentice'),('beggar'),('deviant'),('scapegoat'),('gnome'),('bishop'),('voudon'),('angel'),('buddhist'),('deusexfiasco'),('djinn'),('doomsayer'),('duchess'),('ferryman'),('fibbin'),('fiddler'),('hellslibrarian'),('revolutionary'),('sentinel'),('spiritofivory'),('toymaker'),('bootlegger'),('bigwig'),('gardener'),('godofug'),('hindu'),('knaves'),('pope'),('stormcatcher'),('tor'),('ventriloquist'),('zenomancer');

-- Backfill: mark scripts as homebrew if any character_id is not in the official list
UPDATE scripts SET has_homebrew = true
WHERE EXISTS (
  SELECT 1 FROM unnest(character_ids) AS cid
  WHERE cid NOT IN (SELECT id FROM _official_ids)
);

UPDATE script_versions SET has_homebrew = true
WHERE EXISTS (
  SELECT 1 FROM unnest(character_ids) AS cid
  WHERE cid NOT IN (SELECT id FROM _official_ids)
);

DROP TABLE _official_ids;
