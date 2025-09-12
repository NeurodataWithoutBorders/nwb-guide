"""An API for handling requests to the DANDI Python API."""

from typing import List, Tuple, Union

import flask_restx

dandi_namespace = flask_restx.Namespace(
    name="dandi", description="Request various static listings from the DANDI Python API."
)


@dandi_namespace.route("/get-recommended-species")
class SupportedSpecies(flask_restx.Resource):

    @dandi_namespace.doc(
        description=(
            "Request the list of currently supported species (by Latin Binomial name) for DANDI. Note that any "
            "explicit NCBI taxonomy link is also supported."
        ),
    )
    def get(self) -> Union[List[Tuple[List[str], str, str, str]], None]:
        # from dandi.metadata.util import species_map

        species_map = [(['mouse'],
  'mus',
  'http://purl.obolibrary.org/obo/NCBITaxon_10090',
  'Mus musculus - House mouse'),
 (['human'],
  'homo',
  'http://purl.obolibrary.org/obo/NCBITaxon_9606',
  'Homo sapiens - Human'),
 (['rat', 'norvegicus'],
  None,
  'http://purl.obolibrary.org/obo/NCBITaxon_10116',
  'Rattus norvegicus - Norway rat'),
 (['rattus rattus'],
  None,
  'http://purl.obolibrary.org/obo/NCBITaxon_10117',
  'Rattus rattus - Black rat'),
 (['mulatta', 'rhesus', 'NCBI:txid9544'],
  None,
  'http://purl.obolibrary.org/obo/NCBITaxon_9544',
  'Macaca mulatta - Rhesus monkey'),
 (['jacchus', 'NCBI:txid9483'],
  None,
  'http://purl.obolibrary.org/obo/NCBITaxon_9483',
  'Callithrix jacchus - Common marmoset'),
 (['melanogaster', 'fruit fly', 'NCBI:txid7227'],
  None,
  'http://purl.obolibrary.org/obo/NCBITaxon_7227',
  'Drosophila melanogaster - Fruit fly'),
 (['danio', 'zebrafish', 'zebra fish', 'NCBI:txid7955'],
  None,
  'http://purl.obolibrary.org/obo/NCBITaxon_7955',
  'Danio rerio - Zebra fish'),
 (['c. elegans', 'caenorhabditis elegans', 'NCBI:txid6239'],
  'caenorhabditis',
  'http://purl.obolibrary.org/obo/NCBITaxon_6239',
  'Caenorhabditis elegans'),
 (['pig-tailed macaque', 'pigtail monkey', 'pigtail macaque'],
  None,
  'http://purl.obolibrary.org/obo/NCBITaxon_9545',
  'Macaca nemestrina'),
 (['mongolian gerbil', 'mongolian jird'],
  None,
  'http://purl.obolibrary.org/obo/NCBITaxon_10047',
  'Meriones unguiculatus')]

        return species_map
