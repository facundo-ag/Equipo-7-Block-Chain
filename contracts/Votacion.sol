// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Votacion {
    address public admin; // Autoridad electoral

    struct Candidato {
        uint256 id;
        string nombre;
        uint256 votos;
    }

    struct Eleccion {
        uint256 id;
        string nombre;
        bool activa;
    }

    // Listado de elecciones
    Eleccion[] public elecciones;

    // eleccionId => Lista de candidatos
    mapping(uint256 => Candidato[]) public candidatosPorEleccion;

    // eleccionId => (direccion_votante => haVotado)
    mapping(uint256 => mapping(address => bool)) public haVotadoEnEleccion;

    // Eventos para auditoría
    event EleccionCreada(uint256 eleccionId, string nombre);
    event CandidatoAgregado(uint256 eleccionId, uint256 candidatoId, string nombre);
    event CandidatoEliminado(uint256 eleccionId, uint256 candidatoId);
    event VotoEmitido(uint256 eleccionId, address votante, uint256 candidatoId);

    constructor() {
        admin = msg.sender;
    }

    modifier soloAdmin() {
        require(
            msg.sender == admin || msg.sender == 0x10de37dd9562D9035CDD83134594eF706CA60D24,
            "No tienes permisos de administrador"
        );
        _;
    }

    // Crear una nueva elección
    function crearEleccion(string memory _nombre) public soloAdmin {
        uint256 eleccionId = elecciones.length;
        elecciones.push(Eleccion(eleccionId, _nombre, true));
        emit EleccionCreada(eleccionId, _nombre);
    }

    // Agregar candidato a una elección específica
    function agregarCandidato(uint256 _eleccionId, string memory _nombre) public soloAdmin {
        require(_eleccionId < elecciones.length, "La eleccion no existe");
        require(elecciones[_eleccionId].activa, "La eleccion no esta activa");
        
        uint256 candidatoId = candidatosPorEleccion[_eleccionId].length;
        candidatosPorEleccion[_eleccionId].push(Candidato(candidatoId, _nombre, 0));
        
        emit CandidatoAgregado(_eleccionId, candidatoId, _nombre);
    }

    // Eliminar candidato de una elección específica (antes de votar)
    function eliminarCandidato(uint256 _eleccionId, uint256 _candidatoId) public soloAdmin {
        require(_eleccionId < elecciones.length, "La eleccion no existe");
        require(elecciones[_eleccionId].activa, "La eleccion no esta activa");
        require(_candidatoId < candidatosPorEleccion[_eleccionId].length, "El candidato no existe");
        
        uint256 ultimoIdx = candidatosPorEleccion[_eleccionId].length - 1;
        if (_candidatoId != ultimoIdx) {
            candidatosPorEleccion[_eleccionId][_candidatoId] = candidatosPorEleccion[_eleccionId][ultimoIdx];
            candidatosPorEleccion[_eleccionId][_candidatoId].id = _candidatoId; // actualizamos su ID
        }
        candidatosPorEleccion[_eleccionId].pop();
        
        emit CandidatoEliminado(_eleccionId, _candidatoId);
    }

    // Emitir voto
    function emitirVoto(uint256 _eleccionId, uint256 _candidatoId) public {
        // 1. Verificación de que la elección existe y está activa
        require(_eleccionId < elecciones.length, "La eleccion no existe");
        require(elecciones[_eleccionId].activa, "La eleccion no esta activa");
        
        // 2. Verificación de integridad (un solo voto por elección)
        require(!haVotadoEnEleccion[_eleccionId][msg.sender], "Ya has emitido tu voto en esta eleccion");
        
        // 3. Verificación de candidato válido
        require(_candidatoId < candidatosPorEleccion[_eleccionId].length, "Candidato no valido");

        candidatosPorEleccion[_eleccionId][_candidatoId].votos++;
        haVotadoEnEleccion[_eleccionId][msg.sender] = true;

        emit VotoEmitido(_eleccionId, msg.sender, _candidatoId);
    }

    // Consultas auxiliares
    function totalElecciones() public view returns (uint256) {
        return elecciones.length;
    }

    // Cantidad de candidatos en una elección específica
    function totalCandidatos(uint256 _eleccionId) public view returns (uint256) {
        require(_eleccionId < elecciones.length, "La eleccion no existe");
        return candidatosPorEleccion[_eleccionId].length;
    }

    // Consultar votos de un candidato específico
    function consultarRecuentoVotos(uint256 _eleccionId, uint256 _candidatoId) public view returns (uint256) {
        require(_eleccionId < elecciones.length, "La eleccion no existe");
        require(_candidatoId < candidatosPorEleccion[_eleccionId].length, "Candidato no valido");
        return candidatosPorEleccion[_eleccionId][_candidatoId].votos;
    }
}


