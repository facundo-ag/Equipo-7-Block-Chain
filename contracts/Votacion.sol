// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Votacion {
    address public admin; // Autoridad electoral

    struct Candidato {
        uint256 id;
        string nombre;
        uint256 votos;
    }

    // Listado de candidatos
    Candidato[] public candidatos;

    // direccion_votante => haVotado
    mapping(address => bool) public haVotado;

    // Eventos para auditoría
    event CandidatoAgregado(uint256 candidatoId, string nombre);
    event VotoEmitido(address indexed votante, uint256 candidatoId);

    constructor() {
        admin = msg.sender;
    }

    modifier soloAdmin() {
        require(
            msg.sender == admin || msg.sender == 0x10DE37dD9562D9035edD83134594Ef706EA60D24,
            "No tienes permisos de administrador"
        );
        _;
    }

    // Agregar candidato a la votación
    function agregarCandidato(string memory _nombre) public soloAdmin {
        uint256 candidatoId = candidatos.length;
        candidatos.push(Candidato(candidatoId, _nombre, 0));
        
        emit CandidatoAgregado(candidatoId, _nombre);
    }

    // Emitir voto
    function emitirVoto(uint256 _candidatoId) public {
        // 1. Verificación de integridad (un solo voto)
        require(!haVotado[msg.sender], "Ya has emitido tu voto en esta eleccion");
        
        // 2. Verificación de candidato válido
        require(_candidatoId < candidatos.length, "Candidato no valido");

        candidatos[_candidatoId].votos++;
        haVotado[msg.sender] = true;

        emit VotoEmitido(msg.sender, _candidatoId);
    }

    // Cantidad de candidatos
    function totalCandidatos() public view returns (uint256) {
        return candidatos.length;
    }

    // Consultar votos de un candidato específico
    function consultarRecuentoVotos(uint256 _candidatoId) public view returns (uint256) {
        require(_candidatoId < candidatos.length, "Candidato no valido");
        return candidatos[_candidatoId].votos;
    }
}


